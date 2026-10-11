import React, { useState, useEffect, useRef, useMemo } from "react";
import { Animated, Text, StyleSheet, View } from "react-native";
import { COLORS } from "../constants/theme";
import { useTranslation } from "../store/i18nStore";

interface AnimatedSearchPlaceholderProps {
  phrases?: string[];
  intervalMs?: number;
}

export const AnimatedSearchPlaceholder: React.FC<AnimatedSearchPlaceholderProps> = ({
  phrases,
  intervalMs = 2600,
}) => {
  const { t } = useTranslation();

  const dynamicPhrases = useMemo(() => {
    if (phrases && phrases.length > 0) return phrases;
    return [
      t("search.vitrifiedTiles") || "Search vitrified tiles...",
      t("search.luxurySanitaryware") || "Search luxury sanitaryware...",
      t("search.adhesivesGrouts") || "Search tile adhesives & grouts...",
      t("search.cpFittings") || "Search CP bathroom fittings...",
      t("search.graniteStone") || "Search granite & natural stone...",
      t("search.paintsFinishes") || "Search paints & wall finishes...",
      t("search.electricalFittings") || "Search electrical fittings...",
    ];
  }, [phrases, t]);

  const activePhrases = dynamicPhrases;
  const [index, setIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateYAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activePhrases.length <= 1) return;

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
        setIndex((prev) => (prev + 1) % activePhrases.length);
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
  }, [activePhrases, intervalMs, fadeAnim, translateYAnim]);

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
        {activePhrases[index]}
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
