"use client";

import { useEffect, useRef, useCallback } from "react";
import { getSocket } from "@/lib/socket";

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

  // 2. Real-time WebSocket Relay to Socket.IO
  try {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit("client-action", eventData);
    }
  } catch {
    // Non-blocking socket broadcast
  }

  // 3. Local DOM Event for same-tab instant reactivity
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

  // 4. LocalStorage fallback trigger
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
 * Robust, Multi-Layer Real-Time React Hook.
 * Ensures the UI is ALWAYS fresh across Website, Admin, and Vendor Panels.
 *
 * Features:
 * 1. Instant WebSocket (<50ms) Socket.IO live order/status/product relay.
 * 2. Instant (<1ms) multi-tab cross-panel broadcast notifications.
 * 3. Instant tab focus & visibility change re-validation.
 * 4. Silent, smooth background polling as an automated safety net.
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
  const eventTypesKey = eventTypes ? eventTypes.slice().sort().join(",") : "";

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

    // 1. Socket.IO Real-time Events Listener (Instant across all clients)
    let socket: any = null;
    const handleSocketEvent = (data: any) => {
      triggerSync();
    };

    try {
      socket = getSocket();
      if (socket) {
        socket.on("new-order", handleSocketEvent);
        socket.on("order-status-updated", handleSocketEvent);
        socket.on("update-stats", handleSocketEvent);
        socket.on("product:created", handleSocketEvent);
        socket.on("product:updated", handleSocketEvent);
      }
    } catch (err) {
      console.warn("[LiveSync] Socket subscribe notice:", err);
    }

    // 2. BroadcastChannel Listener (Cross-tab sync)
    const channel = getBroadcastChannel();
    const handleBroadcastMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || !data.type) return;

      const types = eventTypesKey ? eventTypesKey.split(",") : [];
      if (types.length === 0 || types.includes(data.type) || data.type === "data:refresh") {
        triggerSync();
      }
    };

    if (channel) {
      channel.addEventListener("message", handleBroadcastMessage);
    }

    // 3. Same-Window CustomEvent Listener
    const handleLocalEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      const types = eventTypesKey ? eventTypesKey.split(",") : [];
      if (types.length === 0 || types.includes(data?.type) || data?.type === "data:refresh") {
        triggerSync();
      }
    };

    window.addEventListener("intrihub:live-sync", handleLocalEvent);

    // 4. Storage Event Fallback (Cross-tab for older browsers)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "intrihub_last_sync_event" && e.newValue) {
        triggerSync();
      }
    };
    window.addEventListener("storage", handleStorage, { passive: true });

    // 5. Focus & Visibility Change Listener
    const handleFocus = () => {
      if (document.visibilityState === "visible") {
        triggerSync();
      }
    };

    if (enableFocusRefresh) {
      window.addEventListener("focus", handleFocus, { passive: true });
      document.addEventListener("visibilitychange", handleFocus, { passive: true });
    }

    // 6. Silent Background Polling Timer
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
      if (socket) {
        socket.off("new-order", handleSocketEvent);
        socket.off("order-status-updated", handleSocketEvent);
        socket.off("update-stats", handleSocketEvent);
        socket.off("product:created", handleSocketEvent);
        socket.off("product:updated", handleSocketEvent);
      }
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
  }, [triggerSync, eventTypesKey, pollIntervalMs, enableFocusRefresh]);
}
