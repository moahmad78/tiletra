/**
 * IntriHub — Operating Hours Validation Utility (PRD v2 Feature 2)
 *
 * Checks whether a given timestamp falls within a vendor's configured operating hours.
 * Defaults to Asia/Kolkata (IST: UTC+5:30).
 */

export interface DailyHours {
  open?: string; // "09:00"
  close?: string; // "21:00"
  closed?: boolean;
}

export interface OperatingHoursConfig {
  monday?: DailyHours;
  tuesday?: DailyHours;
  wednesday?: DailyHours;
  thursday?: DailyHours;
  friday?: DailyHours;
  saturday?: DailyHours;
  sunday?: DailyHours;
  // Generic single-schedule fallback
  open?: string;
  close?: string;
  days?: Array<{ day: string; open?: string; close?: string; closed?: boolean }>;
}

function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr || typeof timeStr !== "string") return null;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return hours * 60 + minutes;
}

/**
 * Validates if the vendor is currently open based on their operatingHours configuration.
 *
 * @param operatingHours JSON config or object storing the schedule
 * @param date Reference Date object (defaults to new Date())
 * @returns boolean: true if inside operating hours or unconfigured, false if closed
 */
export function isWithinOperatingHours(
  operatingHours: any,
  date: Date = new Date()
): boolean {
  // If no operating hours are configured, vendor is open 24/7 by default
  if (!operatingHours || typeof operatingHours !== "object") {
    return true;
  }

  // If empty object, default to open
  if (Object.keys(operatingHours).length === 0) {
    return true;
  }

  // Get current day name and time in Indian Standard Time (IST)
  let weekday: string;
  let currentMinutes: number;

  try {
    const dayFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      weekday: "long",
    });
    weekday = dayFormatter.format(date).toLowerCase();

    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = timeFormatter.formatToParts(date);
    const hourPart = parts.find((p) => p.type === "hour")?.value || "0";
    const minutePart = parts.find((p) => p.type === "minute")?.value || "0";
    currentMinutes = parseInt(hourPart, 10) * 60 + parseInt(minutePart, 10);
  } catch {
    // Fallback to local time if timezone formatting fails
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    weekday = days[date.getDay()];
    currentMinutes = date.getHours() * 60 + date.getMinutes();
  }

  let dayConfig: DailyHours | undefined;

  // 1. Check array format
  if (Array.isArray(operatingHours.days)) {
    const found = operatingHours.days.find(
      (d: any) => String(d.day).toLowerCase() === weekday
    );
    if (found) {
      dayConfig = {
        open: found.open,
        close: found.close,
        closed: found.closed,
      };
    }
  }

  // 2. Check day-keyed object format (e.g. { monday: { open: "09:00", close: "21:00" } })
  if (!dayConfig && operatingHours[weekday]) {
    dayConfig = operatingHours[weekday];
  }

  // 3. Check generic fallback { open: "09:00", close: "21:00" }
  if (!dayConfig && (operatingHours.open || operatingHours.close)) {
    dayConfig = {
      open: operatingHours.open,
      close: operatingHours.close,
      closed: operatingHours.closed,
    };
  }

  // If no day-specific or generic schedule is defined, assume open
  if (!dayConfig) {
    return true;
  }

  // If marked explicitly closed for this day
  if (dayConfig.closed === true) {
    return false;
  }

  const openMinutes = parseTimeToMinutes(dayConfig.open || "");
  const closeMinutes = parseTimeToMinutes(dayConfig.close || "");

  // If open or close time is missing/invalid, assume open
  if (openMinutes === null || closeMinutes === null) {
    return true;
  }

  // Regular same-day shift (e.g. 09:00 to 21:00)
  if (closeMinutes >= openMinutes) {
    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
  }

  // Overnight shift crossing midnight (e.g. 20:00 to 02:00)
  return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
}
