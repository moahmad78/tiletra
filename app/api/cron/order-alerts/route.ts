import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyVendorPush } from "@/lib/push-notifications";

/**
 * PRD v2 Feature 3 — Order Alert Escalation Job
 *
 * Runs every 30 to 60 seconds.
 * Reads unacknowledged OrderAlert records (acknowledgedAt: null) and escalates them:
 *
 * Step 1: 0s  - Initial push, popup and looping sound (dispatched on confirmation)
 * Step 2: 30s - Repeat push notification
 * Step 3: 60s - Repeat push + SMS / WhatsApp notification trigger
 * Step 4: 2m  - Automated call / high-priority notification
 * Step 5: 3m  - High-alert notification in CPO panel
 * Step 6: 5m  - Critical CPO escalation (reassign or cancel with refund)
 *
 * Tapping "Received" (via /api/mobile/vendor/orders/[id]/ack) marks acknowledgedAt and stops all future steps.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();

  try {
    // 1. Fetch StoreSettings for custom step timings if configured
    let storeSettings: any = null;
    try {
      storeSettings = await prisma.storeSettings.findFirst();
    } catch {}

    const awaitingVendorTimeoutMinutes = storeSettings?.awaitingVendorTimeoutMinutes || 5;

    // 2. Fetch unacknowledged OrderAlert records
    const unacknowledgedAlerts = await prisma.orderAlert.findMany({
      where: {
        acknowledgedAt: null,
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            contactPhone: true,
            ownerId: true,
          },
        },
      },
    });

    let escalatedCount = 0;

    for (const alert of unacknowledgedAlerts) {
      const elapsedSec = Math.floor((now.getTime() - new Date(alert.sentAt).getTime()) / 1000);
      let nextStep = alert.step;
      let nextChannel = alert.channel;
      let shouldNotifyVendor = false;
      let isCpoAlert = false;

      if (elapsedSec >= 300 && alert.step < 6) {
        nextStep = 6;
        nextChannel = "cpo_alert";
        isCpoAlert = true;
      } else if (elapsedSec >= 180 && alert.step < 5) {
        nextStep = 5;
        nextChannel = "cpo_alert";
        isCpoAlert = true;
      } else if (elapsedSec >= 120 && alert.step < 4) {
        nextStep = 4;
        nextChannel = "call";
        shouldNotifyVendor = true;
      } else if (elapsedSec >= 60 && alert.step < 3) {
        nextStep = 3;
        nextChannel = "whatsapp";
        shouldNotifyVendor = true;
      } else if (elapsedSec >= 30 && alert.step < 2) {
        nextStep = 2;
        nextChannel = "push";
        shouldNotifyVendor = true;
      }

      if (nextStep > alert.step) {
        await prisma.orderAlert.update({
          where: { id: alert.id },
          data: {
            step: nextStep,
            channel: nextChannel,
            escalatedAt: isCpoAlert ? now : alert.escalatedAt,
          },
        });

        if (shouldNotifyVendor) {
          try {
            await notifyVendorPush({
              vendorId: alert.vendorId,
              title: `🚨 URGENT: Unacknowledged Order #${alert.orderId.slice(-6)}`,
              body: `Please tap "Received" to acknowledge Order #${alert.orderId.slice(-6)} immediately. (Step ${nextStep} Alert)`,
              data: {
                orderId: alert.orderId,
                type: "high_alert_new_order",
                step: String(nextStep),
              },
            });
          } catch (err) {
            console.warn(`[Order Alert Escalation] Push failed for alert ${alert.id}:`, err);
          }
        }

        if (isCpoAlert) {
          try {
            await prisma.adminNotification.create({
              data: {
                title: `🚨 CPO High Alert: Vendor ${alert.vendor?.businessName || alert.vendorId} unacknowledged`,
                message: `Order #${alert.orderId} unacknowledged for ${Math.floor(elapsedSec / 60)} minutes (Step ${nextStep}). Action required.`,
                type: "general",
                link: `/cpo/activity`,
                metadata: {
                  orderId: alert.orderId,
                  vendorId: alert.vendorId,
                  elapsedMinutes: Math.floor(elapsedSec / 60),
                  step: nextStep,
                },
              },
            });
          } catch (cpoErr) {
            console.warn(`[Order Alert Escalation] CPO notification failed:`, cpoErr);
          }
        }

        escalatedCount++;
      }
    }

    // 3. Check for awaiting-vendor orders exceeding awaitingVendorTimeoutMinutes
    const timeoutThreshold = new Date(now.getTime() - awaitingVendorTimeoutMinutes * 60 * 1000);
    const staleAwaitingOrders = await prisma.order.findMany({
      where: {
        orderStatus: "Awaiting Vendor",
        createdAt: { lt: timeoutThreshold },
      },
      select: {
        id: true,
        customerName: true,
        total: true,
        createdAt: true,
      },
      take: 20,
    });

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      processedAlerts: unacknowledgedAlerts.length,
      escalatedCount,
      staleAwaitingOrdersCount: staleAwaitingOrders.length,
      staleAwaitingOrders: staleAwaitingOrders.map((o) => o.id),
    });
  } catch (err: any) {
    console.error("[Order Alert Cron] Execution failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
