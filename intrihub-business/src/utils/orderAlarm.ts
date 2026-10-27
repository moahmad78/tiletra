import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { isRunningInExpoGo } from "expo";

const isExpoGo =
  isRunningInExpoGo() ||
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof import("expo-notifications") | null = null;
if (!isExpoGo && Platform.OS !== "web") {
  try {
    Notifications = require("expo-notifications");
  } catch (err) {
    console.warn("Could not require expo-notifications in orderAlarm:", err);
  }
}

export const URGENT_ORDER_CHANNEL_ID = "urgent_order_alarm_v3";

/**
 * Initializes the high-importance Android ALARM notification channel.
 * Uses AndroidAudioUsage.ALARM (4) so it routes through STREAM_ALARM.
 * STREAM_ALARM plays audibly even when the device is set to Silent or Vibrate mode!
 */
export async function initOrderAlarmChannel(): Promise<void> {
  if (Platform.OS !== "android" || !Notifications) return;

  try {
    await Notifications.setNotificationChannelAsync(URGENT_ORDER_CHANNEL_ID, {
      name: "Urgent Order Ring Alert (Silent Bypass)",
      importance: (Notifications as any).AndroidImportance?.MAX ?? 7,
      vibrationPattern: [0, 800, 300, 800, 300, 800],
      enableVibrate: true,
      sound: "default",
      lockscreenVisibility: (Notifications as any).AndroidNotificationVisibility?.PUBLIC ?? 1,
      bypassDnd: true,
      audioAttributes: {
        usage: (Notifications as any).AndroidAudioUsage?.ALARM ?? 4,
        contentType: (Notifications as any).AndroidAudioContentType?.SONIFICATION ?? 4,
        flags: {
          enforceAudibility: true,
          requestHardwareAudioVideoSynchronization: false,
        },
      },
      lightColor: "#EA580C",
    });
  } catch (e) {
    console.warn("Failed to create urgent order alarm channel:", e);
  }
}

/**
 * Fires the system alarm notification which rings even in Silent mode on Android.
 */
export async function fireSystemAlarmNotification(
  orderId: string,
  amount?: number
): Promise<void> {
  if (!Notifications || Platform.OS === "web") return;

  try {
    await initOrderAlarmChannel();

    const formattedAmount = amount ? `₹${Number(amount).toLocaleString("en-IN")}` : "";
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🚨 NEW ORDER ALERT!",
        body: `Order #${orderId} ${formattedAmount ? `• ${formattedAmount}` : ""} - Tap to accept & dispatch immediately!`,
        sound: "default",
        data: {
          screen: "/(vendor)/orders",
          orderId,
        },
      },
      trigger: {
        channelId: URGENT_ORDER_CHANNEL_ID,
      } as any,
    });
  } catch (e) {
    console.warn("Could not fire system alarm notification:", e);
  }
}

/**
 * Dismisses all active alarm notifications once the order is accepted or dismissed.
 */
export async function dismissOrderAlarm(): Promise<void> {
  if (!Notifications || Platform.OS === "web") return;
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (e) {
    console.warn("Failed to dismiss order alarm notifications:", e);
  }
}

/**
 * Triggers a heavy vibration pattern.
 */
export async function triggerAlertHaptics(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {}
  }
}

/**
 * HTML code for invisible WebView that generates continuous loud order chime using Web Audio API.
 * High gain, dual frequency pulses (880Hz / 1760Hz).
 */
export const ORDER_ALARM_AUDIO_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>body { background: transparent; margin: 0; padding: 0; overflow: hidden; }</style>
</head>
<body>
<script>
  (function() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      function playChime() {
        try {
          if (ctx.state === 'suspended') {
            ctx.resume();
          }
          const now = ctx.currentTime;

          // Pulse 1: 880Hz -> 1760Hz alert sweep (loud energetic chime)
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(880, now);
          osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.12);
          gain1.gain.setValueAtTime(1.0, now);
          gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.32);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(now);
          osc1.stop(now + 0.32);

          // Pulse 2: 1320Hz punch
          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'square';
          osc2.frequency.setValueAtTime(1320, now + 0.16);
          gain2.gain.setValueAtTime(0.75, now + 0.16);
          gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(now + 0.16);
          osc2.stop(now + 0.45);

          // Pulse 3: 1760Hz high bell ring
          const osc3 = ctx.createOscillator();
          const gain3 = ctx.createGain();
          osc3.type = 'sine';
          osc3.frequency.setValueAtTime(1760, now + 0.36);
          gain3.gain.setValueAtTime(1.0, now + 0.36);
          gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
          osc3.connect(gain3);
          gain3.connect(ctx.destination);
          osc3.start(now + 0.36);
          osc3.stop(now + 0.8);
        } catch(e) {}
      }

      playChime();
      setInterval(playChime, 1400);
    } catch(e) {}
  })();
</script>
</body>
</html>
`;
