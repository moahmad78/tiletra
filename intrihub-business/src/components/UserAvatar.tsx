import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import { Image } from "expo-image";
import { COLORS } from "../constants/theme";

interface UserAvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  borderWidth?: number;
  borderColor?: string;
}

export default function UserAvatar({
  uri,
  name,
  size = 40,
  style,
  textStyle,
  borderWidth = 0,
  borderColor = "#E2E8F0",
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [uri]);

  const initial = name?.trim() ? name.trim()[0].toUpperCase() : "U";
  const fontSize = Math.max(12, Math.round(size * 0.42));
  const borderRadius = Math.round(size / 2);

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    ...(borderWidth > 0 ? { borderWidth, borderColor } : {}),
    ...style,
  };

  const hasValidUri = Boolean(uri && typeof uri === "string" && uri.trim().startsWith("http"));

  if (!hasValidUri || hasError) {
    return (
      <View style={[containerStyle, styles.fallbackContainer]}>
        <Text style={[styles.initialText, { fontSize }, textStyle]}>
          {initial}
        </Text>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Image
        source={{ uri: uri!.trim() }}
        style={{ width: size, height: size, borderRadius }}
        contentFit="cover"
        cachePolicy="memory-disk"
        onError={() => setHasError(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fallbackContainer: {
    backgroundColor: "#052A51",
  },
  initialText: {
    color: "#FFFFFF",
    fontWeight: "900",
    textAlign: "center",
  },
});
