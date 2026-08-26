import React, { useState, useEffect, useRef } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";
import { COLORS } from "../constants/theme";

const DEFAULT_PHRASES = [
  "Search vitrified tiles...",
  "Search luxury sanitaryware...",
  "Search tile adhesives & grouts...",
  "Search CP bathroom fittings...",
  "Search granite & natural stone...",
  "Search paints & wall finishes...",
  "Search electrical fittings...",
];

interface AnimatedSearchPlaceholderProps {
  phrases?: string[];
  intervalMs?: number;
}

export const AnimatedSearchPlaceholder: React.FC<AnimatedSearchPlaceholderProps> = ({
  phrases = DEFAULT_PHRASES,
  intervalMs = 2600,
}) => {
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (phrases.length <= 1) return;

    const interval = setInterval(() => {
      // 1. Slide up and fade out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: -8,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // 2. Change text
        setIndex((prev) => (prev + 1) % phrases.length);
        translateYAnim.setValue(8);

        // 3. Slide in and fade in
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 280,
            useNativeDriver: true,
          }),
          Animated.timing(translateYAnim, {
            toValue: 0,
            duration: 280,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [phrases.length, intervalMs, fadeAnim, translateYAnim]);

  return (
    <View style={styles.container}>
      <Animated.Text
        numberOfLines={1}
        style={[
          styles.text,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateYAnim }],
          },
        ]}
      >
        {phrases[index]}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    overflow: "hidden",
    height: 22,
  },
  text: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "500",
  },
});
