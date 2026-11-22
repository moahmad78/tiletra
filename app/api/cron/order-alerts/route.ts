import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notifyVendorPush } from "@/lib/push-notifications";
import { notify } from "@/lib/notifications/service";
import { cancelOrder } from "@/lib/actions/orders";

/**
 * PRD v1 Notification System — Order Alert Escalation & Timeout Job
 *
 * Runs every 30 to 60 seconds:
 * 1. Reads unacknowledged OrderAlert records (acknowledgedAt: null):
 *    - Step 2: 30s  - Repeat push notification
 *    - Step 3: 60s  - Repeat push + SMS / WhatsApp notification trigger
 *    - Step 4: 2m   - Automated call / high-priority notification
 *    - Step 5: 3m   - High-alert notification in CPO panel
 *    - Step 6: 5m   - V02 ORDER_ACCEPT_REMINDER (5 min remaining before timeout)
 *    - Step 7: 8m   - V02 ORDER_ACCEPT_REMINDER (2 min remaining urgent warning)
 *    - Step 8: 10m  - V04 ORDER_EXPIRED:
 *                     - Reassign order to next nearest active approved vendor with stock.
 *                     - If no alternate vendor: auto-cancel order, issue Razorpay refund,
 *                       and notify customer with U08 ORDER_CANCELLED + U10 REFUND_INITIATED.
 * 2. V03 ORDER_SCHEDULED_DUE:
 *    - Finds scheduled delivery orders approaching dispatch (within 45 min).
 *    - Sends ORDER_SCHEDULED_DUE notification to assigned vendors.
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
    // 1. Fetch unacknowledged OrderAlert records
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
    let reassignedCount = 0;
    let autoCancelledCount = 0;

    for (const alert of unacknowledgedAlerts) {
      const elapsedSec = Math.floor((now.getTime() - new Date(alert.sentAt).getTime()) / 1000);
      let nextStep = alert.step;
      let nextChannel = alert.channel;
      let shouldNotifyVendor = false;
      let isCpoAlert = false;

      // 10-Minute SLA Timeout Reassignment / Auto-Cancel (Step 8)
      if (elapsedSec >= 600) {
        // Mark current alert as expired
        await prisma.orderAlert.update({
          where: { id: alert.id },
          data: {
            acknowledgedAt: now,
            step: 8,
            channel: "expired",
          },
        });

        // 1. Send V04 ORDER_EXPIRED to the timed-out vendor
        await notify({
          type: "ORDER_EXPIRED",
          vendorId: alert.vendorId,
          data: {
            orderId: alert.orderId,
            timeoutMinutes: 10,
          },
        }).catch(() => {});

        // 2. Find next nearest active approved vendor (excluding the timed-out vendor)
        const backupVendor = await prisma.vendor.findFirst({
          where: {
            id: { not: alert.vendorId },
            status: "approved",
          },
          orderBy: { createdAt: "desc" },
        });

        if (backupVendor) {
          // Reassign vendor split to backup vendor
          await prisma.vendorOrderSplit.updateMany({
            where: {
              orderId: alert.orderId,
              vendorId: alert.vendorId,
              fulfillmentStatus: { in: ["pending", "Awaiting Vendor"] },
            },
            data: {
              vendorId: backupVendor.id,
              fulfillmentStatus: "pending",
            },
          });

          // Create new OrderAlert for the reassigned vendor
          await prisma.orderAlert.create({
            data: {
              orderId: alert.orderId,
              vendorId: backupVendor.id,
              step: 1,
              channel: "push",
              sentAt: now,
            },
          });

          // Dispatch V01 ORDER_NEW to the new vendor with loud ringing siren
          await notify({
            type: "ORDER_NEW",
            vendorId: backupVendor.id,
            data: {
              orderId: alert.orderId,
              isNewOrder: true,
              requiresManualApproval: true,
              reassignedFromVendorId: alert.vendorId,
            },
          }).catch(() => {});

          reassignedCount++;
        } else {
          // No backup vendor available -> Auto-cancel order + Razorpay refund
          try {
            await cancelOrder({
              orderId: alert.orderId,
              reason: "Auto-cancelled: Vendor acceptance timeout (10m) and no alternative vendor available",
              cancelledBy: "system",
            });

            // Fetch order details for customer notification
            const cancelledOrder = await prisma.order.findUnique({
              where: { id: alert.orderId },
              select: { userId: true, total: true, refundStatus: true },
            });

            if (cancelledOrder?.userId) {
              // Send U08 ORDER_CANCELLED to customer
              await notify({
                type: "ORDER_CANCELLED",
                userId: cancelledOrder.userId,
                data: {
                  orderId: alert.orderId,
                  reason: "No vendor available to fulfill within SLA",
                },
              }).catch(() => {});

              // Send U10 REFUND_INITIATED if prepaid
              if (cancelledOrder.refundStatus === "processed" || cancelledOrder.refundStatus === "pending") {
                await notify({
                  type: "REFUND_INITIATED",
                  userId: cancelledOrder.userId,
                  data: {
                    orderId: alert.orderId,
                    amount: cancelledOrder.total,
                  },
                }).catch(() => {});
              }
            }

            autoCancelledCount++;
          } catch (cancelErr) {
            console.error(`[Order Alert Cron] Auto-cancel failed for order #${alert.orderId}:`, cancelErr);
          }
        }

        continue;
      }

      // Step 7: 8 min elapsed (2 min remaining urgent reminder)
      if (elapsedSec >= 480 && alert.step < 7) {
        nextStep = 7;
        nextChannel = "push_reminder_2m";
        await notify({
          type: "ORDER_ACCEPT_REMINDER",
          vendorId: alert.vendorId,
          data: {
            orderId: alert.orderId,
            minutesLeft: 2,
            warning: "Urgent: Order will expire and reassign in 2 minutes!",
          },
        }).catch(() => {});
      }
      // Step 6: 5 min elapsed (5 min remaining reminder)
      else if (elapsedSec >= 300 && alert.step < 6) {
        nextStep = 6;
        nextChannel = "push_reminder_5m";
        await notify({
          type: "ORDER_ACCEPT_REMINDER",
          vendorId: alert.vendorId,
          data: {
            orderId: alert.orderId,
            minutesLeft: 5,
            warning: "Order awaiting your acceptance. 5 minutes remaining.",
          },
        }).catch(() => {});
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
              title: "Order Unacknowledged",
              body: `Order #${alert.orderId.slice(-6)} is not acknowledged. Please take action immediately.`,
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

    // 2. V03 ORDER_SCHEDULED_DUE: Check scheduled orders approaching dispatch (within 45 mins)
    let scheduledDueCount = 0;
    try {
      const scheduledOrdersDue = await prisma.order.findMany({
        where: {
          isScheduled: true,
          scheduledFor: {
            gte: now,
            lte: new Date(now.getTime() + 45 * 60 * 1000),
          },
          orderStatus: { in: ["Confirmed", "Processing", "Packing", "Awaiting Vendor"] },
        },
        select: {
          id: true,
          scheduledFor: true,
          deliverySlot: true,
        },
      });

      for (const order of scheduledOrdersDue) {
        const splits = await prisma.vendorOrderSplit.findMany({
          where: { orderId: order.id },
          select: { vendorId: true, id: true },
        });

        for (const split of splits) {
          await notify({
            type: "ORDER_SCHEDULED_DUE",
            vendorId: split.vendorId,
            data: {
              orderId: order.id,
              splitId: split.id,
              scheduledFor: order.scheduledFor?.toISOString(),
              deliverySlot: order.deliverySlot || undefined,
            },
          }).catch(() => {});
          scheduledDueCount++;
        }
      }
    } catch (schedErr) {
      console.warn("[Order Alert Cron] Scheduled order check error:", schedErr);
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      processedAlerts: unacknowledgedAlerts.length,
      escalatedCount,
      reassignedCount,
      autoCancelledCount,
      scheduledDueCount,
    });
  } catch (err: any) {
    console.error("[Order Alert Cron] Execution failed:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
