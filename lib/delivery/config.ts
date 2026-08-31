/**
 * IntriHub — 60-Minute Delivery Automation: Configurable Constants
 *
 * All tunable thresholds live here. Change them without a code deploy
 * by updating this file — no magic numbers scattered across the codebase.
 */

export const DELIVERY_CONFIG = {
  // ── SLA Packing Timer (F4) ──────────────────────────────────────────────
  /** Minutes the vendor gets to pack an order after acceptance */
  PACKING_SLA_MINUTES: 10,

  /** Send a "hurry up" push to vendor this many minutes before deadline */
  PACKING_WARNING_MINUTES: 3,

  // ── Rider Auto-Assignment (F5) ───────────────────────────────────────────
  /** Max distance (km) within which we search for an available in-house rider */
  RIDER_SEARCH_RADIUS_KM: 5,

  /** Time to wait (ms) for an in-house rider before triggering 3rd-party fallback */
  RIDER_SEARCH_TIMEOUT_MS: 2 * 60 * 1000, // 2 minutes

  // ── Third-Party Delivery (F6) ─────────────────────────────────────────────
  /** Which 3rd-party provider to use as fallback ("porter" | "dunzo" | "shiprocket") */
  THIRD_PARTY_PROVIDER: "porter" as "porter" | "dunzo" | "shiprocket",

  // ── Geo-Fencing (F2) ────────────────────────────────────────────────────
  /**
   * When no vendor has GPS coordinates, fall back to the original
   * product-listed vendor (safe degradation = no silent failures).
   */
  GEO_FENCING_ENABLED: true,

  // ── SLA Cron ─────────────────────────────────────────────────────────────
  /** How often the SLA breach checker runs (seconds) */
  SLA_CRON_INTERVAL_SECONDS: 60,
} as const;
