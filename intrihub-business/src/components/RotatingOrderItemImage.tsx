import React, { useState, useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import { Image } from "expo-image";
import { getImageUrl } from "../api/client";

interface RotatingOrderItemImageProps {
  images?: string[];
  fallbackImage?: string;
  size?: number;
  borderRadius?: number;
  autoRotateInterval?: number;
  showDots?: boolean;
}

export default function RotatingOrderItemImage({
  images = [],
  fallbackImage,
  size = 56,
  borderRadius = 10,
  autoRotateInterval = 2500,
  showDots = true,
}: RotatingOrderItemImageProps) {
  // Collect all unique, valid image URLs
  const validImages: string[] = [];

  if (Array.isArray(images)) {
    for (const img of images) {
      if (
        img &&
        typeof img === "string" &&
        img.trim() !== "" &&
        !img.includes("placeholder") &&
        !validImages.includes(img.trim())
      ) {
        validImages.push(img.trim());
      }
    }
  }

  if (
    fallbackImage &&
    typeof fallbackImage === "string" &&
    fallbackImage.trim() !== "" &&
    !fallbackImage.includes("placeholder") &&
    !validImages.includes(fallbackImage.trim())
  ) {
    validImages.push(fallbackImage.trim());
  }

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-rotate if more than 1 image exists
  useEffect(() => {
    if (validImages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % validImages.length);
    }, autoRotateInterval);

    return () => clearInterval(timer);
  }, [validImages.length, autoRotateInterval]);

  const currentImg = validImages.length > 0 ? validImages[currentIndex % validImages.length] : null;

  if (!currentImg) {
    return (
      <View
        style={[
          styles.container,
          styles.fallbackContainer,
          { width: size, height: size, borderRadius },
        ]}
      >
        <Text style={{ fontSize: Math.max(16, Math.round(size * 0.42)) }}>📦</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { width: size, height: size, borderRadius }]}>
      <Image
        key={currentImg}
        source={{ uri: getImageUrl(currentImg) }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
        contentFit="cover"
        transition={300}
      />

      {/* Multi-image indicators */}
      {validImages.length > 1 && showDots && (
        <View style={styles.dotsOverlay}>
          {validImages.slice(0, 4).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex % Math.min(4, validImages.length)
                  ? styles.dotActive
                  : styles.dotInactive,
              ]}
            />
          ))}
        </View>
      )}

      {/* Counter Badge if > 2 images */}
      {validImages.length > 2 && (
        <View style={styles.badgeOverlay}>
          <Text style={styles.badgeText}>
            {(currentIndex % validImages.length) + 1}/{validImages.length}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  fallbackContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    backgroundColor: "#F8FAFC",
  },
  dotsOverlay: {
    position: "absolute",
    bottom: 3,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.25)",
    paddingVertical: 1.5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
    width: 6,
  },
  dotInactive: {
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  badgeOverlay: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "rgba(15,23,42,0.7)",
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 7,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
