/**
 * Formats numeric values to Indian Rupee (INR) currency format with ₹ symbol
 */
export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "₹0";
  }

  const rounded = Math.round(amount);
  return `₹${rounded.toLocaleString("en-IN")}`;
}

/**
 * Formats a Date object or ISO string to a human-readable date
 */
export function formatDate(dateInput?: string | Date | null): string {
  if (!dateInput) return "N/A";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
}

/**
 * Formats a Date object or ISO string to time
 */
export function formatTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "";
  try {
    const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}
