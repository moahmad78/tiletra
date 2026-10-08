import { prisma as rawPrisma } from "@/lib/prisma";
import { sendNotification } from "@/lib/notification-service";

const prisma = rawPrisma as any;

export interface CartReminderJobResult {
  processed: number;
  sent: number;
  skipped: number;
  stopped: number;
  skipReasons: Record<string, number>;
  details: Array<{
    userId: string;
    step: number;
    cartVersion: number;
    action: "sent" | "skipped" | "stopped";
    reason?: string;
  }>;
}

/**
 * Calculates next active IST 08:00 time when quiet hours end.
 */
export function getNextKolkataActiveTime(endStr = "08:00", now = new Date()): Date {
  const [endH, endM] = endStr.split(":").map(Number);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value) - 1;
  const d = Number(parts.find((p) => p.type === "day")?.value);
  const h = Number(parts.find((p) => p.type === "hour")?.value);

  let targetDay = d;
  if (h >= endH) {
    targetDay += 1;
  }
  return new Date(Date.UTC(y, m, targetDay, endH - 5, (endM || 0) - 30, 0));
}

/**
 * Called whenever a user's cart is updated in the database.
 * Upserts CartReminderState and resets the reminder ladder to step 0.
 */
export async function recordCartChange(userId: string, itemsCount: number): Promise<void> {
  if (!userId) return;

  try {
    const existing = await prisma.cartReminderState.findUnique({
      where: { userId },
    });

    if (itemsCount <= 0) {
      // Cart emptied -> Stop reminder ladder immediately (Rule R-6)
      if (existing && existing.status !== "stopped") {
        await prisma.cartReminderState.update({
          where: { userId },
          data: { status: "stopped", nextDueAt: null },
        });
      }
      return;
    }

    // Get delay configuration from store settings
    const settings = await prisma.storeSettings.findFirst({
      select: { cartReminderDelaysHours: true },
    });
    const delays: number[] = settings?.cartReminderDelaysHours?.length
      ? settings.cartReminderDelaysHours
      : [1, 24, 72];
    const firstDelayHours = delays[0] || 1;

    const now = new Date();
    const nextDueAt = new Date(now.getTime() + firstDelayHours * 60 * 60 * 1000);
    const newVersion = (existing?.cartVersion || 0) + 1;

    if (existing) {
      await prisma.cartReminderState.update({
        where: { userId },
        data: {
          cartVersion: newVersion,
          lastCartChangeAt: now,
          step: 0,
          status: "pending",
          nextDueAt,
        },
      });
    } else {
      await prisma.cartReminderState.create({
        data: {
          userId,
          cartVersion: 1,
          lastCartChangeAt: now,
          step: 0,
          status: "pending",
          nextDueAt,
        },
      });
    }
  } catch (error) {
    console.error(`[recordCartChange] Failed to update CartReminderState for ${userId}:`, error);
  }
}

/**
 * Called when an order is placed or cart reminders are disabled by user.
 * Immediately stops the cart reminder ladder (Rule R-6).
 */
export async function cancelCartReminder(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await prisma.cartReminderState.updateMany({
      where: { userId, status: { in: ["pending", "processing"] } },
      data: { status: "stopped", nextDueAt: null },
    });
  } catch (error) {
    console.error(`[cancelCartReminder] Failed to cancel reminder for ${userId}:`, error);
  }
}

/**
 * Runs the cart reminder job.
 * Finds all pending reminder states where nextDueAt <= now, atomically claims each row,
 * verifies R-6 stop conditions, formats Hinglish copy, and sends via sendNotification.
 */
export async function runCartRemindersJob(options?: {
  forceNow?: boolean; // If true, process rows regardless of nextDueAt (for manual test runs)
}): Promise<CartReminderJobResult> {
  const result: CartReminderJobResult = {
    processed: 0,
    sent: 0,
    skipped: 0,
    stopped: 0,
    skipReasons: {},
    details: [],
  };

  const now = new Date();

  // 1. Fetch store settings for delays and caps
  const settings = await prisma.storeSettings.findFirst({
    select: {
      cartReminderDelaysHours: true,
      maxCartReminders: true,
      cartRemindersPaused: true,
      quietHoursEnd: true,
    },
  });

  const delays: number[] = settings?.cartReminderDelaysHours?.length
    ? settings.cartReminderDelaysHours
    : [1, 24, 72];
  const maxReminders = settings?.maxCartReminders ?? 3;
  const quietHoursEnd = settings?.quietHoursEnd ?? "08:00";

  // 2. Query pending rows due for reminders
  const whereClause: any = {
    status: "pending",
  };
  if (!options?.forceNow) {
    whereClause.nextDueAt = { lte: now };
  }

  const dueReminders = await prisma.cartReminderState.findMany({
    where: whereClause,
    take: 100, // Process in controlled batches
    orderBy: { nextDueAt: "asc" },
  });

  if (!dueReminders || dueReminders.length === 0) {
    return result;
  }

  for (const reminder of dueReminders) {
    // 3. ATOMIC CLAIM: Update status from "pending" to "processing"
    const claim = await prisma.cartReminderState.updateMany({
      where: {
        id: reminder.id,
        status: "pending",
      },
      data: {
        status: "processing",
      },
    });

    // If claim failed (another runner claimed it), skip
    if (claim.count === 0) {
      continue;
    }

    result.processed++;

    try {
      // 4. VERIFY RULE R-6 STOP CONDITIONS
      // 4a. Check user notification preferences
      const pref = await prisma.notificationPreference.findUnique({
        where: { userId: reminder.userId },
        select: { cartRemindersEnabled: true },
      });
      if (pref && pref.cartRemindersEnabled === false) {
        await prisma.cartReminderState.update({
          where: { id: reminder.id },
          data: { status: "stopped", nextDueAt: null },
        });
        result.stopped++;
        result.details.push({
          userId: reminder.userId,
          step: reminder.step,
          cartVersion: reminder.cartVersion,
          action: "stopped",
          reason: "preferences_disabled",
        });
        continue;
      }

      // 4b. Check if cart still has items
      const cart = await prisma.cart.findUnique({
        where: { userId: reminder.userId },
        include: {
          items: {
            include: {
              variant: {
                include: { product: true },
              },
            },
          },
        },
      });

      const items = cart?.items || [];
      if (items.length === 0) {
        // Cart is empty -> stop ladder
        await prisma.cartReminderState.update({
          where: { id: reminder.id },
          data: { status: "stopped", nextDueAt: null },
        });
        result.stopped++;
        result.details.push({
          userId: reminder.userId,
          step: reminder.step,
          cartVersion: reminder.cartVersion,
          action: "stopped",
          reason: "empty_cart",
        });
        continue;
      }

      // 4c. Check if an order was placed after lastCartChangeAt
      const placedOrder = await prisma.order.findFirst({
        where: {
          userId: reminder.userId,
          createdAt: { gte: reminder.lastCartChangeAt },
        },
        select: { id: true },
      });

      if (placedOrder) {
        // Order placed -> stop ladder
        await prisma.cartReminderState.update({
          where: { id: reminder.id },
          data: { status: "stopped", nextDueAt: null },
        });
        result.stopped++;
        result.details.push({
          userId: reminder.userId,
          step: reminder.step,
          cartVersion: reminder.cartVersion,
          action: "stopped",
          reason: "order_placed",
        });
        continue;
      }

      // 5. PREPARE MESSAGE COPY PER PRD SECTION 5
      const totalItemCount = items.reduce((sum: number, it: any) => sum + (it.boxQuantity || 1), 0);
      const firstItemName =
        items[0]?.variant?.product?.title || items[0]?.variant?.product?.name || "Items";
      const restCount = Math.max(0, items.length - 1);

      let title = "";
      let body = "";

      // reminder step 0 -> sends reminder 1
      // reminder step 1 -> sends reminder 2
      // reminder step 2 -> sends reminder 3
      if (reminder.step === 0) {
        title = "Aapka cart intezaar kar raha hai";
        body = `Aapke cart me ${totalItemCount} items hain. Order poora karein.`;
      } else if (reminder.step === 1) {
        title = "Kuch bhool rahe hain?";
        body =
          restCount > 0
            ? `${firstItemName} aur ${restCount} aur items cart me hain.`
            : `${firstItemName} cart me hai. Order poora karein.`;
      } else {
        title = "Cart me items abhi bhi hain";
        body = "Order poora karne ke liye tap karein.";
      }

      // Enforce PRD title/body limits (Title max 40, Body max 90)
      if (title.length > 40) title = title.substring(0, 37) + "...";
      if (body.length > 90) body = body.substring(0, 87) + "...";

      // 6. DISPATCH VIA CENTRAL NOTIFICATION SERVICE
      const sendRes = await sendNotification({
        userId: reminder.userId,
        type: "cart_reminder",
        title,
        body,
        target: "cart",
        cartVersion: reminder.cartVersion,
        step: reminder.step + 1,
      });

      if (sendRes.status === "skipped") {
        const reason = sendRes.skipReason || "unknown";
        result.skipped++;
        result.skipReasons[reason] = (result.skipReasons[reason] || 0) + 1;

        if (reason === "user_recently_active") {
          // Rule R-7: postpone reminder by 30 minutes, once
          const postponed = new Date(now.getTime() + 30 * 60 * 1000);
          await prisma.cartReminderState.update({
            where: { id: reminder.id },
            data: { status: "pending", nextDueAt: postponed },
          });
        } else if (reason === "quiet_hours") {
          // Rule R-4: due in quiet window -> send at 08:00 IST
          const nextActive = getNextKolkataActiveTime(quietHoursEnd, now);
          await prisma.cartReminderState.update({
            where: { id: reminder.id },
            data: { status: "pending", nextDueAt: nextActive },
          });
        } else if (reason === "preferences_disabled") {
          await prisma.cartReminderState.update({
            where: { id: reminder.id },
            data: { status: "stopped", nextDueAt: null },
          });
          result.stopped++;
        } else if (reason === "paused") {
          // If paused, keep pending but push back slightly so we don't spin-loop
          const retryLater = new Date(now.getTime() + 30 * 60 * 1000);
          await prisma.cartReminderState.update({
            where: { id: reminder.id },
            data: { status: "pending", nextDueAt: retryLater },
          });
        } else if (reason === "daily_cap_reached") {
          // Daily cap reached -> postpone to tomorrow morning
          const tomorrowMorning = getNextKolkataActiveTime(quietHoursEnd, now);
          await prisma.cartReminderState.update({
            where: { id: reminder.id },
            data: { status: "pending", nextDueAt: tomorrowMorning },
          });
        } else {
          // Other skips (e.g. no_tokens or already_sent)
          await prisma.cartReminderState.update({
            where: { id: reminder.id },
            data: { status: "stopped", nextDueAt: null },
          });
        }

        result.details.push({
          userId: reminder.userId,
          step: reminder.step,
          cartVersion: reminder.cartVersion,
          action: "skipped",
          reason,
        });
      } else if (sendRes.status === "sent") {
        result.sent++;
        const nextStep = reminder.step + 1;

        if (nextStep >= maxReminders) {
          // Reached final reminder step (Rule R-5: Stop after reminder 3)
          await prisma.cartReminderState.update({
            where: { id: reminder.id },
            data: {
              step: nextStep,
              status: "done",
              nextDueAt: null,
            },
          });
        } else {
          // Schedule next step in the ladder
          const nextDelayHours = delays[nextStep] ?? 24;
          const nextDue = new Date(now.getTime() + nextDelayHours * 60 * 60 * 1000);
          await prisma.cartReminderState.update({
            where: { id: reminder.id },
            data: {
              step: nextStep,
              status: "pending",
              nextDueAt: nextDue,
            },
          });
        }

        result.details.push({
          userId: reminder.userId,
          step: reminder.step,
          cartVersion: reminder.cartVersion,
          action: "sent",
        });
      } else {
        // Failed send (e.g. fatal network/API error)
        result.skipped++;
        // Revert to pending with 15 min backoff
        const retryLater = new Date(now.getTime() + 15 * 60 * 1000);
        await prisma.cartReminderState.update({
          where: { id: reminder.id },
          data: { status: "pending", nextDueAt: retryLater },
        });
        result.details.push({
          userId: reminder.userId,
          step: reminder.step,
          cartVersion: reminder.cartVersion,
          action: "skipped",
          reason: sendRes.error || "failed",
        });
      }
    } catch (err: any) {
      console.error(`[runCartRemindersJob] Error processing reminder ${reminder.id}:`, err);
      // Ensure row does not get stuck in "processing"
      await prisma.cartReminderState.update({
        where: { id: reminder.id },
        data: { status: "pending", nextDueAt: new Date(now.getTime() + 10 * 60 * 1000) },
      });
    }
  }

  return result;
}
