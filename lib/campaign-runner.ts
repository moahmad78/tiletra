import { prisma as rawPrisma } from "@/lib/prisma";
import { sendNotification, PlatformTarget } from "@/lib/notification-service";
import { resolveAudienceUserIds } from "@/lib/campaign-audience";

const prisma = rawPrisma as any;

export interface CampaignDispatchStats {
  totalAudience: number;
  sent: number;
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

  // Finalize campaign state
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: "sent",
      sentAt: new Date(),
      stats: stats as any,
    },
  });

  return stats;
}

/**
 * T8: Campaign Sender Scheduled Job
 * Queries due scheduled campaigns, atomically claims them, and delivers them.
 */
export async function processScheduledCampaigns(): Promise<{
  processed: number;
  results: Array<{ campaignId: string; stats: CampaignDispatchStats }>;
}> {
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
    // Atomic claim: update status to "sending"
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
      continue; // Claimed by another runner
    }

    try {
      const stats = await dispatchCampaign(campaign.id);
      results.push({ campaignId: campaign.id, stats });
    } catch (err) {
      console.error(`[processScheduledCampaigns] Error processing campaign ${campaign.id}:`, err);
      // Revert status to draft or scheduled
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
