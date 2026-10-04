/**
 * IntriHub Unified Delivery Scheduling & Slot Management
 * Shared across Next.js Web and React Native (Expo) apps.
 *
 * Rules:
 * - 2-hour minimum lead time from now.
 * - 7 days booking window (today through next 6 days).
 * - Standard 2-hour delivery slots.
 * - Exact manual IST calculations (+05:30 offset) without external date libraries.
 */

export const IST_OFFSET_MINUTES = 330; // 5 hours 30 minutes
export const IST_OFFSET_MS = IST_OFFSET_MINUTES * 60 * 1000; // 19,800,000 ms
export const MIN_LEAD_HOURS = 2;
export const MIN_LEAD_MS = MIN_LEAD_HOURS * 60 * 60 * 1000; // 7,200,000 ms
export const SCHEDULE_DAYS_COUNT = 7;

export interface DeliverySlotDefinition {
  id: string;
  startHour: number; // 24-hr IST
  endHour: number;   // 24-hr IST
  label: string;     // e.g. "10:00 AM - 12:00 PM"
}

export const STANDARD_DELIVERY_SLOTS: DeliverySlotDefinition[] = [
  { id: "08-10", startHour: 8, endHour: 10, label: "08:00 AM - 10:00 AM" },
  { id: "10-12", startHour: 10, endHour: 12, label: "10:00 AM - 12:00 PM" },
  { id: "12-14", startHour: 12, endHour: 14, label: "12:00 PM - 02:00 PM" },
  { id: "14-16", startHour: 14, endHour: 16, label: "02:00 PM - 04:00 PM" },
  { id: "16-18", startHour: 16, endHour: 18, label: "04:00 PM - 06:00 PM" },
  { id: "18-20", startHour: 18, endHour: 20, label: "06:00 PM - 08:00 PM" },
  { id: "20-22", startHour: 20, endHour: 22, label: "08:00 PM - 10:00 PM" },
];

export interface SlotAvailability {
  slot: DeliverySlotDefinition;
  available: boolean;
  scheduledForUtcIso: string; // ISO 8601 UTC timestamp of slot start
  formattedFullSlot: string;  // e.g. "Sun, 4 Oct • 10:00 AM - 12:00 PM"
}

export interface DeliveryDayOption {
  dateString: string; // "YYYY-MM-DD" in IST
  dayLabel: string;   // "Today", "Tomorrow", "Tue", "Wed", etc.
  dateLabel: string;  // "4 Oct", "5 Oct"
  fullDateLabel: string; // "Sunday, 4 October"
  slots: SlotAvailability[];
  hasAvailableSlots: boolean;
}

const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

/**
 * Returns year, month (1-12), date (1-31), dayOfWeek (0-6), hours (0-23), minutes (0-59) in IST
 */
export function getISTParts(timestampMs: number = Date.now()) {
  const istDate = new Date(timestampMs + IST_OFFSET_MS);
  return {
    year: istDate.getUTCFullYear(),
    month: istDate.getUTCMonth() + 1,
    date: istDate.getUTCDate(),
    dayOfWeek: istDate.getUTCDay(),
    hours: istDate.getUTCHours(),
    minutes: istDate.getUTCMinutes(),
  };
}

/**
 * Formats a two-digit integer string (e.g. 8 -> "08")
 */
function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * Formats date to YYYY-MM-DD string in IST
 */
export function formatISTDateKey(year: number, month: number, date: number): string {
  return `${year}-${pad2(month)}-${pad2(date)}`;
}

/**
 * Converts an IST date string ("YYYY-MM-DD") and slot start hour into a real UTC Date object.
 */
export function getSlotUtcDate(dateString: string, startHour: number, startMinute: number = 0): Date {
  const parts = dateString.split("-").map(Number);
  const year = parts[0];
  const month = parts[1];
  const date = parts[2];
  // Date.UTC treats the parameters as UTC. Subtracting IST_OFFSET_MS yields the correct UTC instant.
  const utcMs = Date.UTC(year, month - 1, date, startHour, startMinute, 0, 0) - IST_OFFSET_MS;
  return new Date(utcMs);
}

/**
 * Generates the full 7-day schedule with all slots and computed availability based on min 2h lead time.
 */
export function getAvailableDeliverySchedule(nowMs: number = Date.now()): DeliveryDayOption[] {
  const days: DeliveryDayOption[] = [];
  const currentIST = getISTParts(nowMs);
  const minLeadInstantMs = nowMs + MIN_LEAD_MS;

  // Compute midnight IST for today
  const todayMidnightUtcMs = Date.UTC(currentIST.year, currentIST.month - 1, currentIST.date, 0, 0, 0) - IST_OFFSET_MS;

  for (let d = 0; d < SCHEDULE_DAYS_COUNT; d++) {
    const dayTimestampMs = todayMidnightUtcMs + d * 24 * 60 * 60 * 1000;
    const dayIST = getISTParts(dayTimestampMs);
    const dateString = formatISTDateKey(dayIST.year, dayIST.month, dayIST.date);

    let dayLabel = DAYS_SHORT[dayIST.dayOfWeek];
    if (d === 0) dayLabel = "Today";
    else if (d === 1) dayLabel = "Tomorrow";

    const dateLabel = `${dayIST.date} ${MONTHS_SHORT[dayIST.month - 1]}`;
    const fullDateLabel = `${DAYS_FULL[dayIST.dayOfWeek]}, ${dayIST.date} ${MONTHS_FULL[dayIST.month - 1]}`;

    const slots: SlotAvailability[] = STANDARD_DELIVERY_SLOTS.map((slot) => {
      const slotUtcDate = getSlotUtcDate(dateString, slot.startHour, 0);
      const slotStartMs = slotUtcDate.getTime();
      // Slot is available if it starts at least MIN_LEAD_MS after now (with 1-min clock tolerance)
      const available = slotStartMs >= minLeadInstantMs - 60 * 1000;
      const formattedFullSlot = `${DAYS_SHORT[dayIST.dayOfWeek]}, ${dayIST.date} ${MONTHS_SHORT[dayIST.month - 1]} • ${slot.label}`;

      return {
        slot,
        available,
        scheduledForUtcIso: slotUtcDate.toISOString(),
        formattedFullSlot,
      };
    });

    const hasAvailableSlots = slots.some((s) => s.available);

    days.push({
      dateString,
      dayLabel,
      dateLabel,
      fullDateLabel,
      slots,
      hasAvailableSlots,
    });
  }

  return days;
}

/**
 * Validates a scheduled delivery submission server-side.
 * Returns valid: true and parsed values, or valid: false with an error message.
 */
export function validateDeliverySchedule(
  scheduledFor: string | null | undefined,
  slotId: string | null | undefined,
  nowMs: number = Date.now()
): {
  valid: boolean;
  isScheduled: boolean;
  scheduledForDate?: Date;
  deliverySlot?: string;
  error?: string;
} {
  // If no slot specified or empty, this is a standard "Deliver ASAP" order.
  if (!scheduledFor && !slotId) {
    return {
      valid: true,
      isScheduled: false,
      scheduledForDate: undefined,
      deliverySlot: undefined,
    };
  }

  if (!scheduledFor || !slotId) {
    return {
      valid: false,
      isScheduled: true,
      error: "Both scheduled date/time and slot identifier are required for scheduled delivery.",
    };
  }

  const slotDef = STANDARD_DELIVERY_SLOTS.find((s) => s.id === slotId);
  if (!slotDef) {
    return {
      valid: false,
      isScheduled: true,
      error: `Invalid delivery slot identifier: "${slotId}".`,
    };
  }

  const scheduledDate = new Date(scheduledFor);
  const scheduledTimeMs = scheduledDate.getTime();
  if (isNaN(scheduledTimeMs)) {
    return {
      valid: false,
      isScheduled: true,
      error: "Invalid scheduled date/time format.",
    };
  }

  // Check minimum 2-hour lead time (allow 60s network/clock jitter buffer)
  if (scheduledTimeMs < nowMs + MIN_LEAD_MS - 60 * 1000) {
    return {
      valid: false,
      isScheduled: true,
      error: "Selected delivery slot is no longer available. Please select a slot at least 2 hours in advance.",
    };
  }

  // Check maximum schedule window (within 8 days from now)
  const maxAllowedMs = nowMs + (SCHEDULE_DAYS_COUNT + 1) * 24 * 60 * 60 * 1000;
  if (scheduledTimeMs > maxAllowedMs) {
    return {
      valid: false,
      isScheduled: true,
      error: "Orders can only be scheduled up to 7 days in advance.",
    };
  }

  // Format deliverySlot string in IST for human readability
  const ist = getISTParts(scheduledTimeMs);
  const deliverySlotFormatted = `${DAYS_SHORT[ist.dayOfWeek]}, ${ist.date} ${MONTHS_SHORT[ist.month - 1]} • ${slotDef.label}`;

  return {
    valid: true,
    isScheduled: true,
    scheduledForDate: scheduledDate,
    deliverySlot: deliverySlotFormatted,
  };
}

/**
 * Universal display formatter for scheduled orders.
 * Handles existing orders where fields might be undefined/null safely.
 */
export function formatDeliverySlotDisplay(
  scheduledFor?: string | Date | null,
  deliverySlot?: string | null,
  isScheduled?: boolean | null
): string | null {
  if (deliverySlot && deliverySlot.trim()) {
    return deliverySlot.trim();
  }

  if (!scheduledFor) return null;

  const dateObj = typeof scheduledFor === "string" ? new Date(scheduledFor) : scheduledFor;
  if (isNaN(dateObj.getTime())) return null;

  const ist = getISTParts(dateObj.getTime());
  const hours = ist.hours;
  const endHour = (hours + 2) % 24;

  const formatAmPm = (h: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return `${pad2(displayHour)}:00 ${period}`;
  };

  return `${DAYS_SHORT[ist.dayOfWeek]}, ${ist.date} ${MONTHS_SHORT[ist.month - 1]} • ${formatAmPm(hours)} - ${formatAmPm(endHour)}`;
}
