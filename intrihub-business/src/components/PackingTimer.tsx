import { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Clock, AlertTriangle } from "lucide-react-native";

interface PackingTimerProps {
  /** ISO 8601 timestamp string — the packing deadline */
  deadline: string;
  /** Fired when the timer reaches 0 */
  onExpired?: () => void;
}

/**
 * F4 — Packing SLA Countdown Timer
 *
 * Displayed on the vendor order detail screen when status = "confirmed".
 * - Shows MM:SS countdown
 * - Turns orange when < 3 minutes remain (warning zone)
 * - Turns red and pulses when < 1 minute remains or timer is breached
 * - Shows "SLA BREACHED" banner when time runs out
 */
export function PackingTimer({ deadline, onExpired }: PackingTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    Math.max(0, Math.floor((new Date(deadline).getTime() - Date.now()) / 1000))
  );
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const isExpired = secondsLeft <= 0;
  const isWarning = secondsLeft > 0 && secondsLeft <= 3 * 60;   // < 3 min → orange
  const isCritical = secondsLeft > 0 && secondsLeft <= 60;       // < 1 min → red + pulse

  // ── Countdown tick ──
  useEffect(() => {
    if (isExpired) {
      onExpired?.();
      return;
    }
    const interval = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(deadline).getTime() - Date.now()) / 1000)
      );
      setSecondsLeft(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadline, isExpired]);

  // ── Pulse animation when critical ──
  useEffect(() => {
    if (isCritical || isExpired) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.4, duration: 500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isCritical, isExpired]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeDisplay = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const timerColor = isExpired
    ? "#EF4444"    // red
    : isCritical
    ? "#EF4444"    // red
    : isWarning
    ? "#F97316"    // orange
    : "#22C55E";   // green

  const bgColor = isExpired
    ? "rgba(239,68,68,0.1)"
    : isCritical
    ? "rgba(239,68,68,0.1)"
    : isWarning
    ? "rgba(249,115,22,0.1)"
    : "rgba(34,197,94,0.1)";

  if (isExpired) {
    return (
      <Animated.View style={[styles.container, { backgroundColor: "rgba(239,68,68,0.15)", opacity: pulseAnim }]}>
        <AlertTriangle size={18} color="#EF4444" />
        <View style={styles.content}>
          <Text style={[styles.label, { color: "#EF4444" }]}>SLA BREACHED</Text>
          <Text style={[styles.subLabel, { color: "#EF4444" }]}>
            Packing time exceeded — Admin has been notified
          </Text>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: bgColor },
        (isCritical || isExpired) && { opacity: pulseAnim },
      ]}
    >
      <Clock size={18} color={timerColor} />
      <View style={styles.content}>
        <Text style={[styles.label, { color: timerColor }]}>
          Pack and mark Ready in{" "}
          <Text style={styles.timeDisplay}>{timeDisplay}</Text>
        </Text>
        <Text style={styles.subLabel}>
          {isCritical
            ? "⚠️ Pack immediately — deadline almost here!"
            : isWarning
            ? "Hurry up — time is running out!"
            : "Tap 'Ready' once you've packed the order"}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    gap: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  timeDisplay: {
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  subLabel: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 2,
  },
});
