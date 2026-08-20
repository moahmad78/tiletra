"use client";

import { useEffect, useRef, useCallback } from "react";

// Universal Channel Name for Cross-Tab & Cross-Panel Sync
const CHANNEL_NAME = "intrihub_realtime_sync";

export type LiveEventType =
  | "order:new"
  | "order:status-updated"
  | "product:created"
  | "product:updated"
  | "product:status-toggled"
  | "vendor:updated"
  | "settings:updated"
  | "data:refresh";

let broadcastChannelInstance: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!("BroadcastChannel" in window)) return null;

  if (!broadcastChannelInstance) {
    try {
      broadcastChannelInstance = new BroadcastChannel(CHANNEL_NAME);
    } catch (e) {
      console.warn("[LiveSync] BroadcastChannel init error:", e);
    }
  }
  return broadcastChannelInstance;
}

/**
 * Broadcasts an instant event to ALL open browser tabs, panels, and components.
 * Latency is typically <1ms.
 */
export function broadcastLiveEvent(eventType: LiveEventType | string, payload?: any) {
  if (typeof window === "undefined") return;

  const eventData = {
    type: eventType,
    payload,
    timestamp: Date.now(),
  };

  // 1. Cross-Tab / Cross-Panel Broadcast (Storefront ➔ Admin ➔ Vendor)
  try {
    const channel = getBroadcastChannel();
    if (channel) {
      channel.postMessage(eventData);
    }
  } catch (e) {
    console.warn("[LiveSync] Failed to postMessage:", e);
  }

  // 2. Local DOM Event for same-tab instant reactivity
  try {
    window.dispatchEvent(
      new CustomEvent("intrihub:live-sync", {
        detail: eventData,
      })
    );
    window.dispatchEvent(
      new CustomEvent(`intrihub:${eventType}`, {
        detail: eventData,
      })
    );
  } catch (e) {
    console.warn("[LiveSync] Failed to dispatch CustomEvent:", e);
  }

  // 3. LocalStorage fallback trigger
  try {
    localStorage.setItem("intrihub_last_sync_event", JSON.stringify(eventData));
  } catch {
    // Ignore storage quota errors
  }
}

interface UseLiveSyncOptions {
  /**
   * Optional specific event types to listen for.
   * If omitted or empty, listens to all live sync events.
   */
  eventTypes?: (LiveEventType | string)[];
  /**
   * Callback to execute when a real-time event occurs or on auto-poll.
   */
  onSync: () => void | Promise<void>;
  /**
   * Background polling interval in milliseconds.
   * Default is 5000ms (5 seconds) for real-time responsiveness.
   * Set to 0 to disable periodic polling.
   */
  pollIntervalMs?: number;
  /**
   * Automatically re-fetch immediately when user returns/focuses the browser tab.
   * Default is true.
   */
  enableFocusRefresh?: boolean;
}

/**
 * Robust, Dual-Layer Real-Time React Hook.
 * Ensures the UI is ALWAYS fresh without requiring the user to refresh the page.
 *
 * Features:
 * 1. Instant (<1ms) multi-tab cross-panel broadcast notifications.
 * 2. Instant tab focus & visibility change re-validation.
 * 3. Silent, smooth background polling (every 5 seconds) as an automated safety net.
 */
export function useLiveSync({
  eventTypes,
  onSync,
  pollIntervalMs = 5000,
  enableFocusRefresh = true,
}: UseLiveSyncOptions) {
  const syncCallbackRef = useRef(onSync);
  syncCallbackRef.current = onSync;

  const isSyncingRef = useRef(false);

  const triggerSync = useCallback(async () => {
    if (isSyncingRef.current) return;
    try {
      isSyncingRef.current = true;
      await syncCallbackRef.current();
    } catch (err) {
      console.warn("[LiveSync] Sync error:", err);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Initial load
    triggerSync();

    // 1. BroadcastChannel Listener (Cross-tab sync)
    const channel = getBroadcastChannel();
    const handleBroadcastMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || !data.type) return;

      if (!eventTypes || eventTypes.length === 0 || eventTypes.includes(data.type) || data.type === "data:refresh") {
        console.log(`[LiveSync ⚡] Cross-tab event: ${data.type}`);
        triggerSync();
      }
    };

    if (channel) {
      channel.addEventListener("message", handleBroadcastMessage);
    }

    // 2. Same-Window CustomEvent Listener
    const handleLocalEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      if (!eventTypes || eventTypes.length === 0 || eventTypes.includes(data?.type) || data?.type === "data:refresh") {
        triggerSync();
      }
    };

    window.addEventListener("intrihub:live-sync", handleLocalEvent);

    // 3. Storage Event Fallback (Cross-tab for older browsers)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "intrihub_last_sync_event" && e.newValue) {
        triggerSync();
      }
    };
    window.addEventListener("storage", handleStorage);

    // 4. Focus & Visibility Change Listener
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        triggerSync();
      }
    };

    if (enableFocusRefresh) {
      window.addEventListener("focus", handleFocus);
      document.addEventListener("visibilitychange", handleFocus);
    }

    // 5. Silent Background Polling Timer
    let intervalId: any = null;
    if (pollIntervalMs > 0) {
      intervalId = setInterval(() => {
        // Only poll if document is visible to save battery/bandwidth
        if (document.visibilityState === "visible") {
          triggerSync();
        }
      }, pollIntervalMs);
    }

    return () => {
      if (channel) {
        channel.removeEventListener("message", handleBroadcastMessage);
      }
      window.removeEventListener("intrihub:live-sync", handleLocalEvent);
      window.removeEventListener("storage", handleStorage);
      if (enableFocusRefresh) {
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener("visibilitychange", handleFocus);
      }
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [triggerSync, eventTypes, pollIntervalMs, enableFocusRefresh]);
}
