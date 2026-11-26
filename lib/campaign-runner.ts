import { prisma as rawPrisma } from "@/lib/prisma";
import { sendNotification, PlatformTarget } from "@/lib/notification-service";
import { resolveAudienceUserIds } from "@/lib/campaign-audience";
import { checkPendingExpoReceipts } from "@/lib/push-notifications";

const prisma = rawPrisma as any;

export interface CampaignDispatchStats {
  totalAudience: number;
  sent: number;
  delivered?: number;
  opened?: number;
  ctr?: number;
  skipped: number;
  failed: number;
  androidSent: number;
  iosSent: number;
  skipReasons: Record<string, number>;
}

/**
 * Dispatches a campaign to its target audience.
 * Uses atomic progress updates and idempotency checks to resume safely if interrupted.
 */
export async function dispatchCampaign(
  campaignId: string,
  options?: { sentByAdminId?: string }
): Promise<CampaignDispatchStats> {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign) {
    throw new Error(`Campaign ${campaignId} not found`);
  }

  // Update status to sending if not already
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: "sending" },
  });

  // Resolve target audience user IDs
  const userIds = await resolveAudienceUserIds(campaign.audience as any);

  const stats: CampaignDispatchStats = {
    totalAudience: userIds.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    androidSent: 0,
    iosSent: 0,
    skipReasons: {},
  };

  const platformFilter = (campaign.platforms || "all") as PlatformTarget;

  // Process users in batches of 50 to adhere to rate limits and prevent memory spikes
  const BATCH_SIZE = 50;
  const CHUNK_SIZE = 10;
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE);

    for (let c = 0; c < batch.length; c += CHUNK_SIZE) {
      const chunk = batch.slice(c, c + CHUNK_SIZE);
      await Promise.all(
        chunk.map(async (userId) => {
          try {
            // Idempotency check: Don't send if already logged as sent for this campaign
            const alreadyLogged = await prisma.notificationLog.findFirst({
              where: {
                userId,
                campaignId,
                status: { in: ["sent", "delivered", "opened"] },
              },
            });

            if (alreadyLogged) {
              stats.sent++;
              return;
            }

            const result = await sendNotification({
              userId,
              type: "offer_campaign",
              title: campaign.title,
              body: campaign.body,
              imageUrl: campaign.imageUrl,
              target: campaign.target || "offers",
              campaignId: campaign.id,
              platformFilter,
              sentByAdminId: options?.sentByAdminId || campaign.createdBy || undefined,
            });

            if (result.status === "sent") {
              stats.sent++;
              // Fetch token platform to update split counts
              const userTokens = await prisma.deviceToken.findMany({
                where: { userId },
                select: { platform: true },
              });
              const hasAndroid = userTokens.some((t: any) => t.platform === "android");
              const hasIos = userTokens.some((t: any) => t.platform === "ios");
              if (hasAndroid) stats.androidSent++;
              if (hasIos) stats.iosSent++;
            } else if (result.status === "skipped") {
              stats.skipped++;
              const reason = result.skipReason || "unknown";
              stats.skipReasons[reason] = (stats.skipReasons[reason] || 0) + 1;
            } else {
              stats.failed++;
            }
          } catch (userErr) {
            console.error(`[dispatchCampaign] Error sending to user ${userId}:`, userErr);
            stats.failed++;
          }
        })
      );
    }
  }

  // Finalize campaign state with initial stats
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: "sent",
      sentAt: new Date(),
      stats: stats as any,
    },
  });

  // Lazy trigger receipts check
  checkPendingExpoReceipts().catch(() => {});

  return stats;
}

/**
 * T8: Campaign Sender Scheduled Job
 * Queries due scheduled campaigns, atomically claims them, delivers them,
 * and handles recurring occurrences idempotently.
 */
export async function processScheduledCampaigns(): Promise<{
  processed: number;
  results: Array<{ campaignId: string; stats: CampaignDispatchStats }>;
}> {
  // Check any pending Expo push receipts
  await checkPendingExpoReceipts().catch(() => {});

  const now = new Date();
  const dueCampaigns = await prisma.campaign.findMany({
    where: {
      status: "scheduled",
      scheduledAt: { lte: now },
    },
    take: 5,
  });

  const results: Array<{ campaignId: string; stats: CampaignDispatchStats }> = [];

  for (const campaign of dueCampaigns) {
    // Atomic claim: update status to "sending" to prevent any race conditions
    const claim = await prisma.campaign.updateMany({
      where: {
        id: campaign.id,
        status: "scheduled",
      },
      data: {
        status: "sending",
      },
    });

    if (claim.count === 0) {
      continue; // Claimed by another parallel runner
    }

    try {
      const stats = await dispatchCampaign(campaign.id);
      results.push({ campaignId: campaign.id, stats });

      // Handle recurrence idempotently after successful send
      if (campaign.recurrence && campaign.recurrence !== "none") {
        const baseDate = campaign.scheduledAt || new Date();
        const nextDate = new Date(baseDate);

        if (campaign.recurrence === "daily") {
          nextDate.setDate(nextDate.getDate() + 1);
        } else if (campaign.recurrence === "weekly") {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (campaign.recurrence === "yearly") {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }

        const isExpired = campaign.expiresAt && nextDate > new Date(campaign.expiresAt);
        if (!isExpired) {
          // Idempotency: verify occurrence doesn't already exist
          const existingNext = await prisma.campaign.findFirst({
            where: {
              title: campaign.title,
              scheduledAt: nextDate,
              status: { in: ["scheduled", "sending", "sent"] },
            },
          });

          if (!existingNext) {
            let nextCountdown: Date | null = null;
            if (campaign.countdownEndsAt) {
              const diffMs = new Date(campaign.countdownEndsAt).getTime() - new Date(baseDate).getTime();
              nextCountdown = new Date(nextDate.getTime() + diffMs);
            }

            await prisma.campaign.create({
              data: {
                title: campaign.title,
                body: campaign.body,
                imageUrl: campaign.imageUrl,
                target: campaign.target,
                type: campaign.type || "OFFER",
                accentColor: campaign.accentColor,
                ctaLabel: campaign.ctaLabel,
                countdownEndsAt: nextCountdown,
                recurrence: campaign.recurrence,
                expiresAt: campaign.expiresAt,
                appTarget: campaign.appTarget || "both",
                popup: campaign.popup,
                schemaVersion: campaign.schemaVersion || 1,
                audience: campaign.audience,
                platforms: campaign.platforms,
                sendMode: "scheduled",
                status: "scheduled",
                scheduledAt: nextDate,
                createdBy: campaign.createdBy,
              },
            });
            console.log(
              `[Campaign Recurrence] Created next ${campaign.recurrence} occurrence for "${campaign.title}" at ${nextDate.toISOString()}`
            );
          }
        }
      }
    } catch (err) {
      console.error(`[processScheduledCampaigns] Error processing campaign ${campaign.id}:`, err);
      // Revert status to scheduled so it can be retried
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: "scheduled" },
      });
    }
  }

  return {
    processed: results.length,
    results,
  };
}
