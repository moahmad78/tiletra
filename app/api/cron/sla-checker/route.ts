import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DELIVERY_CONFIG } from "@/lib/delivery/config";

/**
 * F4 — SLA Breach Checker Cron Endpoint
 *
 * This route should be called every 60 seconds by a cron service
 * (e.g., Vercel Cron, GitHub Actions, or a system cron hitting this URL).
 *
 * URL: GET /api/cron/sla-checker
 * Auth: Authorization: Bearer <CRON_SECRET>
 *
 * What it does:
 *   1. Finds orders approaching their packing deadline (within PACKING_WARNING_MINUTES)
 *      and sends vendor a "hurry up" push notification.
 *   2. Finds orders that have BREACHED their packing deadline:
 *      - Sets slaBreach = true, packingBreachAt = now
 *      - Pushes escalation alert to admin/ops
 */
export async function GET(req: NextRequest) {
  // Protect cron endpoint with a secret header
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  try {
    // ── 1. Warn vendors approaching deadline (T-PACKING_WARNING_MINUTES) ─────
    const warningWindowStart = new Date(
      now.getTime() - (DELIVERY_CONFIG.PACKING_WARNING_MINUTES + 1) * 60 * 1000
    );
    const warningWindowEnd = new Date(
      now.getTime() - (DELIVERY_CONFIG.PACKING_WARNING_MINUTES - 1) * 60 * 1000
    );

    const approachingSLA = await prisma.vendorOrderSplit.findMany({
      where: {
        fulfillmentStatus: "confirmed",
        slaBreach: false,
        packingDeadline: {
          gte: now,
          lte: new Date(now.getTime() + DELIVERY_CONFIG.PACKING_WARNING_MINUTES * 60 * 1000),
        },
      },
      include: {
        vendor: {
          select: { id: true, businessName: true, ownerId: true },
        },
      },
    });

    let warningsSent = 0;
    for (const split of approachingSLA) {
      const minutesLeft = split.packingDeadline
        ? Math.ceil((split.packingDeadline.getTime() - now.getTime()) / 60000)
        : DELIVERY_CONFIG.PACKING_WARNING_MINUTES;

      try {
        const { notifyVendorPush } = await import("@/lib/push-notifications");
        await notifyVendorPush({
          vendorId: split.vendorId,
          title: `⏰ ${minutesLeft} min to pack — Order #${split.orderId.slice(-6)}`,
          body: `Packing deadline approaching! Mark order as "Ready for Pickup" within ${minutesLeft} minute(s) to avoid SLA breach.`,
          data: {
            type: "sla_warning",
            splitId: split.id,
            orderId: split.orderId,
            packingDeadline: split.packingDeadline?.toISOString(),
          },
        });
        warningsSent++;
      } catch (warnErr) {
        console.warn(`[SLA Cron] Warning push failed for split ${split.id}:`, warnErr);
      }
    }

    // ── 2. Detect and escalate SLA breaches ──────────────────────────────────
    const breachedSplits = await prisma.vendorOrderSplit.findMany({
      where: {
        fulfillmentStatus: "confirmed",
        slaBreach: false,
        packingDeadline: { lt: now },
      },
      include: {
        vendor: {
          select: { id: true, businessName: true, contactPhone: true },
        },
      },
    });

    let breachesDetected = 0;
    for (const split of breachedSplits) {
      try {
        // Mark as breached
        await prisma.vendorOrderSplit.update({
          where: { id: split.id },
          data: {
            slaBreach: true,
            packingBreachAt: now,
          },
        });

        // Socket broadcast to admin room for live dashboard update
        try {
          const { emitSocketEvent } = await import("@/lib/socket-server-emit");
          await emitSocketEvent({
            room: "admin-room",
            event: "sla-breach",
            data: {
              splitId: split.id,
              orderId: split.orderId,
              vendorId: split.vendorId,
              vendorName: split.vendor?.businessName,
              packingDeadline: split.packingDeadline,
              breachedAt: now,
            },
          });
        } catch {}

        // Push escalation to admin/ops
        const { notifyAdminPush } = await import("@/lib/push-notifications");
        await notifyAdminPush({
          title: `🚨 Packing SLA Breached — ${split.vendor?.businessName || split.vendorId}`,
          body: `Order #${split.orderId.slice(-6)} has been waiting for ${DELIVERY_CONFIG.PACKING_SLA_MINUTES}+ minutes. Vendor hasn't packed yet.`,
          data: {
            type: "sla_breach",
            splitId: split.id,
            orderId: split.orderId,
            vendorId: split.vendorId,
            vendorPhone: split.vendor?.contactPhone,
          },
        });

        // Create admin notification in DB for the dashboard
        await prisma.adminNotification.create({
          data: {
            title: `SLA Breach: ${split.vendor?.businessName || "Vendor"}`,
            message: `Order #${split.orderId.slice(-6)} exceeded ${DELIVERY_CONFIG.PACKING_SLA_MINUTES}-minute packing SLA. Vendor: ${split.vendor?.contactPhone || split.vendorId}`,
            type: "sla_breach",
            link: `/admin/orders/${split.orderId}`,
            metadata: {
              splitId: split.id,
              vendorId: split.vendorId,
              packingDeadline: split.packingDeadline?.toISOString(),
            },
          },
        });

        breachesDetected++;
      } catch (breachErr) {
        console.error(`[SLA Cron] Failed to process breach for split ${split.id}:`, breachErr);
      }
    }

    console.info(
      `[SLA Cron] Run complete — ${warningsSent} warnings sent, ${breachesDetected} breaches detected`
    );

    return NextResponse.json({
      success: true,
      runAt: now.toISOString(),
      warningsSent,
      breachesDetected,
    });
  } catch (error: any) {
    console.error("[SLA Cron] Fatal error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "SLA cron failed" },
      { status: 500 }
    );
  }
}
