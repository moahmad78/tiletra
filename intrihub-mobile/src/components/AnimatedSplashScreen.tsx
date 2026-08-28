import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
} from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AnimatedSplashScreenProps {
  onAnimationFinish?: () => void;
  isAppReady: boolean;
}

export default function AnimatedSplashScreen({
  onAnimationFinish,
  isAppReady,
}: AnimatedSplashScreenProps) {
  const insets = useSafeAreaInsets();

  // Master Fade & Exit
  const exitOpacity = useRef(new Animated.Value(1)).current;
  const exitScale = useRef(new Animated.Value(1)).current;

  // Intro Sequence Timings
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(12)).current;
  const ambientOpacity = useRef(new Animated.Value(0)).current;

  // Ambient Floating & Pulsing
  const packageFloat = useRef(new Animated.Value(0)).current;
  const pinPulse = useRef(new Animated.Value(1)).current;
  const pinRipple = useRef(new Animated.Value(0)).current;
  const routeParticle = useRef(new Animated.Value(0)).current;

  // Road Active Running Streams (Looping 0 -> 1)
  const roadStreamA = useRef(new Animated.Value(0)).current;
  const roadStreamB = useRef(new Animated.Value(0)).current;
  const roadStreamC = useRef(new Animated.Value(0)).current;
  const roadStreamD = useRef(new Animated.Value(0)).current;

  // Loading Ring Rotation
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 1. Entrance Sequence
    Animated.parallel([
      Animated.timing(ambientOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(100),
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(logoScale, {
            toValue: 1,
            duration: 650,
            easing: Easing.out(Easing.back(1.15)),
            useNativeDriver: true,
          }),
        ]),
      ]),
      Animated.sequence([
        Animated.delay(380),
        Animated.parallel([
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 550,
            useNativeDriver: true,
          }),
          Animated.timing(taglineTranslateY, {
            toValue: 0,
            duration: 550,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // 2. Package Floating (2-4px vertical floating loop)
    Animated.loop(
      Animated.sequence([
        Animated.timing(packageFloat, {
          toValue: -4,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(packageFloat, {
          toValue: 0,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Location Pin Pulse & Ripple Wave
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pinPulse, {
            toValue: 1.14,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pinPulse, {
            toValue: 1.0,
            duration: 900,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pinRipple, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(pinRipple, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // 4. Delivery Route Traveling Particle Loop
    Animated.loop(
      Animated.timing(routeParticle, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 5. Continuous Running Road Streams (Staggered continuous flow)
    Animated.loop(
      Animated.timing(roadStreamA, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(roadStreamB, {
          toValue: 1,
          duration: 1250,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(roadStreamC, {
          toValue: 1,
          duration: 1150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(950),
        Animated.timing(roadStreamD, {
          toValue: 1,
          duration: 1300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 6. Loading Spinner Rotation
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 950,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Exit transition triggered when app is initialized
  useEffect(() => {
    if (isAppReady) {
      Animated.parallel([
        Animated.timing(exitOpacity, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(exitScale, {
          toValue: 1.03,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onAnimationFinish) {
          onAnimationFinish();
        }
      });
    }
  }, [isAppReady]);

  // Loading Spin
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Particle path along the curve
  const particleX = routeParticle.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 115, 235],
  });
  const particleY = routeParticle.interpolate({
    inputRange: [0, 0.35, 0.75, 1],
    outputRange: [0, -10, 10, 26],
  });
  const particleOpacity = routeParticle.interpolate({
    inputRange: [0, 0.08, 0.88, 1],
    outputRange: [0, 1, 1, 0],
  });

  // Road Stream A (Blue & Orange)
  const roadATranslateY = roadStreamA.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 200],
  });
  const roadATranslateX = roadStreamA.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 90],
  });
  const roadAOpacity = roadStreamA.interpolate({
    inputRange: [0, 0.15, 0.8, 1],
    outputRange: [0, 1, 0.85, 0],
  });

  // Road Stream B (Electric Cyan & Amber)
  const roadBTranslateY = roadStreamB.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 200],
  });
  const roadBTranslateX = roadStreamB.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 90],
  });
  const roadBOpacity = roadStreamB.interpolate({
    inputRange: [0, 0.15, 0.8, 1],
    outputRange: [0, 1, 0.85, 0],
  });

  // Road Stream C (White & Gold)
  const roadCTranslateY = roadStreamC.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 200],
  });
  const roadCTranslateX = roadStreamC.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 90],
  });
  const roadCOpacity = roadStreamC.interpolate({
    inputRange: [0, 0.15, 0.8, 1],
    outputRange: [0, 1, 0.85, 0],
  });

  // Road Stream D (Fast Neon Pulse)
  const roadDTranslateY = roadStreamD.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 200],
  });
  const roadDTranslateX = roadStreamD.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 90],
  });
  const roadDOpacity = roadStreamD.interpolate({
    inputRange: [0, 0.15, 0.8, 1],
    outputRange: [0, 1, 0.85, 0],
  });

  const rippleScale = pinRipple.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.5],
  });
  const rippleOpacity = pinRipple.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0.8, 0.35, 0],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: exitOpacity,
          transform: [{ scale: exitScale }],
        },
      ]}
      pointerEvents="none"
    >
      {/* Background Gradient matching PRD */}
      <LinearGradient
        colors={["#FFFFFF", "#F5F8FC", "#EBF3FB"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Ambient Glow Washes */}
      <Animated.View style={[styles.ambientLayer, { opacity: ambientOpacity }]}>
        <LinearGradient
          colors={["rgba(234, 88, 12, 0.12)", "rgba(255, 255, 255, 0)"]}
          style={styles.topWarmGlow}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={["rgba(5, 42, 81, 0.09)", "rgba(255, 255, 255, 0)"]}
          style={styles.bottomCoolGlow}
          start={{ x: 1, y: 1 }}
          end={{ x: 0, y: 0 }}
        />
      </Animated.View>

      <View style={[styles.contentWrapper, { paddingTop: insets.top + 16 }]}>
        {/* TOP: Floating 3D Package, Curved Dotted Route & Location Pin */}
        <View style={styles.topRouteSection}>
          <Svg width={SCREEN_WIDTH - 30} height={100} viewBox="0 0 320 100">
            <Defs>
              <SvgLinearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <Stop offset="0%" stopColor="#94A3B8" stopOpacity="0.6" />
                <Stop offset="50%" stopColor="#EA580C" stopOpacity="0.75" />
                <Stop offset="100%" stopColor="#EA580C" stopOpacity="1" />
              </SvgLinearGradient>
            </Defs>

            {/* Dotted Delivery Route Arc */}
            <Path
              d="M 50 24 C 110 2, 190 54, 270 38"
              fill="none"
              stroke="url(#routeGrad)"
              strokeWidth="2"
              strokeDasharray="5, 6"
            />
          </Svg>

          {/* Floating Isometric 3D Package on Left */}
          <Animated.View
            style={[
              styles.packageContainer,
              { transform: [{ translateY: packageFloat }] },
            ]}
          >
            <Svg width={46} height={46} viewBox="0 0 48 48">
              <Path
                d="M 24 6 L 40 14 L 24 22 L 8 14 Z"
                fill="#CBD5E1"
                stroke="#94A3B8"
                strokeWidth="1.2"
              />
              <Path
                d="M 8 14 L 24 22 L 24 38 L 8 30 Z"
                fill="#94A3B8"
                stroke="#64748B"
                strokeWidth="1.2"
              />
              <Path
                d="M 24 22 L 40 14 L 40 30 L 24 38 Z"
                fill="#64748B"
                stroke="#475569"
                strokeWidth="1.2"
              />
              <Path d="M 12 11 L 20 6 L 28 10 L 20 15 Z" fill="rgba(255,255,255,0.4)" />
              <Path d="M 24 22 L 24 38" stroke="#334155" strokeWidth="1.5" />
            </Svg>
          </Animated.View>

          {/* Animated Travelling Particle along the Route */}
          <Animated.View
            style={[
              styles.routeParticle,
              {
                opacity: particleOpacity,
                transform: [
                  { translateX: particleX },
                  { translateY: particleY },
                ],
              },
            ]}
          >
            <View style={styles.particleGlow} />
            <View style={styles.particleCore} />
          </Animated.View>

          {/* Pulsing Destination Location Pin on Right */}
          <View style={styles.pinContainer}>
            <Animated.View
              style={[
                styles.pinRippleCircle,
                {
                  opacity: rippleOpacity,
                  transform: [{ scale: rippleScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.pinIconWrapper,
                { transform: [{ scale: pinPulse }] },
              ]}
            >
              <Svg width={24} height={30} viewBox="0 0 24 30">
                <Path
                  d="M 12 0 C 5.37 0 0 5.37 0 12 C 0 20.5 12 30 12 30 C 12 30 24 20.5 24 12 C 24 5.37 18.63 0 12 0 Z"
                  fill="#EA580C"
                />
                <Circle cx="12" cy="11" r="4.5" fill="#FFFFFF" />
              </Svg>
            </Animated.View>
          </View>
        </View>

        {/* CENTER: Intrihub Delivery Truck Logo + Branding */}
        <Animated.View
          style={[
            styles.brandSection,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          {/* Main Truck + Arrow Logo */}
          <View style={styles.logoWrapper}>
            <Svg width={180} height={140} viewBox="0 0 180 140">
              <Defs>
                <SvgLinearGradient id="silverArrow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <Stop offset="0%" stopColor="#94A3B8" />
                  <Stop offset="40%" stopColor="#E2E8F0" />
                  <Stop offset="80%" stopColor="#CBD5E1" />
                  <Stop offset="100%" stopColor="#FFFFFF" />
                </SvgLinearGradient>
                <SvgLinearGradient id="orangeArrowHead" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#F97316" />
                  <Stop offset="100%" stopColor="#C2410C" />
                </SvgLinearGradient>
              </Defs>

              {/* Truck Navy Silhouette Body */}
              <Path
                d="M 45 32 L 105 32 C 108 32, 110 34, 110 37 L 110 44 L 132 44 C 136 44, 139 47, 142 51 L 152 66 C 153 68, 154 70, 154 73 L 154 98 C 154 102, 150 106, 146 106 L 139 106 C 137 96, 128 89, 118 89 C 108 89, 99 96, 97 106 L 73 106 C 71 96, 62 89, 52 89 C 42 89, 33 96, 31 106 L 24 106 C 20 106, 16 102, 16 98 L 16 45 C 16 38, 22 32, 29 32 Z"
                fill="#052A51"
              />

              {/* Truck Cab Window Cutout */}
              <Path
                d="M 116 52 L 133 52 C 135 52, 137 54, 139 57 L 145 68 C 146 70, 145 72, 143 72 L 116 72 Z"
                fill="#FFFFFF"
                opacity="0.95"
              />

              {/* Cargo Box Contour */}
              <Rect
                x="32"
                y="42"
                width="42"
                height="34"
                rx="4"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.5"
                opacity="0.9"
              />

              {/* Wheels */}
              <Circle cx="52" cy="106" r="14" fill="#052A51" />
              <Circle cx="52" cy="106" r="6.5" fill="#FFFFFF" />
              <Circle cx="118" cy="106" r="14" fill="#052A51" />
              <Circle cx="118" cy="106" r="6.5" fill="#FFFFFF" />

              {/* Dynamic Forward-Pointing Arrow */}
              <Path
                d="M 12 78 C 16 66, 32 55, 60 52 L 98 48 L 94 36 L 130 60 L 92 84 L 96 70 L 62 72 C 38 74, 24 85, 18 96 Z"
                fill="url(#silverArrow)"
                stroke="#FFFFFF"
                strokeWidth="1.5"
              />

              {/* Orange Inner Arrowhead Tip */}
              <Path
                d="M 102 54 L 124 60 L 100 68 L 102 61 Z"
                fill="url(#orangeArrowHead)"
              />
            </Svg>
          </View>

          {/* "intrihub" Wordmark */}
          <Text style={styles.wordmark}>
            <Text style={styles.wordmarkNavy}>intri</Text>
            <Text style={styles.wordmarkOrange}>hub</Text>
          </Text>

          {/* "QUICKCOMMERCE" Subtitle */}
          <Text style={styles.quickcommerceText}>Q U I C K C O M M E R C E</Text>

          {/* Decorative Orange Divider Pill */}
          <View style={styles.dividerPill} />
        </Animated.View>

        {/* Tagline: "Everything for Every Space" */}
        <Animated.View
          style={[
            styles.taglineWrapper,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
            },
          ]}
        >
          <Text style={styles.taglineText}>
            <Text style={styles.taglineNavy}>Everything for </Text>
            <Text style={styles.taglineOrange}>Every Space</Text>
          </Text>
        </Animated.View>

        {/* BOTTOM: Dynamic Highway + Moving Light Trails + Skyline */}
        <View style={styles.bottomSection}>
          {/* City Skyline Background Silhouette */}
          <View style={styles.skylineWrapper}>
            <Svg width={SCREEN_WIDTH} height={70} viewBox="0 0 360 70">
              <Path
                d="M 0 70 L 0 50 L 12 50 L 12 38 L 22 38 L 22 50 L 35 50 L 35 28 L 44 28 L 44 14 L 47 14 L 47 28 L 56 28 L 56 50 L 70 50 L 70 42 L 82 42 L 82 50 L 98 50 L 98 22 L 108 22 L 108 8 L 112 8 L 112 22 L 122 22 L 122 50 L 140 50 L 140 32 L 152 32 L 152 50 L 175 50 L 175 18 L 186 18 L 186 5 L 190 5 L 190 18 L 202 18 L 202 50 L 220 50 L 220 36 L 232 36 L 232 50 L 250 50 L 250 24 L 262 24 L 262 50 L 285 50 L 285 30 L 298 30 L 298 50 L 320 50 L 320 40 L 334 40 L 334 50 L 360 50 L 360 70 Z"
                fill="rgba(148, 175, 205, 0.28)"
              />
              <Circle cx="64" cy="36" r="4.5" fill="#3B82F6" opacity="0.6" />
              <Circle cx="260" cy="22" r="4.5" fill="#EA580C" opacity="0.6" />
            </Svg>
          </View>

          {/* 3D Sweeping Curved Highway Roadbed */}
          <View style={styles.roadWrapper}>
            <Svg width={SCREEN_WIDTH} height={190} viewBox="0 0 360 190" preserveAspectRatio="none">
              <Defs>
                <SvgLinearGradient id="roadBase" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#1E3A5F" stopOpacity="0.4" />
                  <Stop offset="35%" stopColor="#0B2A4A" stopOpacity="0.88" />
                  <Stop offset="100%" stopColor="#041830" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>

              {/* Sweeping 3D Roadbed Geometry */}
              <Path
                d="M 45 42 C 70 38, 120 54, 155 78 C 210 115, 275 145, 360 160 L 360 190 L 0 190 L 0 55 C 18 48, 32 44, 45 42 Z"
                fill="url(#roadBase)"
              />

              {/* Static Neon Highway Guidelines */}
              <Path
                d="M 45 42 C 85 45, 140 76, 185 110 C 230 145, 290 165, 360 174"
                fill="none"
                stroke="rgba(0, 210, 255, 0.35)"
                strokeWidth="3"
              />
              <Path
                d="M 52 44 C 95 50, 155 84, 205 120 C 255 155, 310 172, 360 182"
                fill="none"
                stroke="rgba(255, 130, 0, 0.4)"
                strokeWidth="3"
              />
            </Svg>

            {/* ANIMATED ACTIVE RUNNING LIGHT TRAILS (Stream A: Cyan & Orange) */}
            <Animated.View
              style={[
                styles.runningLightStream,
                {
                  opacity: roadAOpacity,
                  transform: [
                    { translateX: roadATranslateX },
                    { translateY: roadATranslateY },
                  ],
                },
              ]}
            >
              <Svg width={SCREEN_WIDTH} height={80} viewBox="0 0 360 80">
                <Path
                  d="M 50 4 C 100 16, 150 36, 210 56"
                  fill="none"
                  stroke="#00F0FF"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <Path
                  d="M 80 8 C 135 24, 190 44, 260 64"
                  fill="none"
                  stroke="#FF6B00"
                  strokeWidth="4.5"
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>

            {/* ANIMATED ACTIVE RUNNING LIGHT TRAILS (Stream B: Electric Blue & Amber) */}
            <Animated.View
              style={[
                styles.runningLightStream,
                {
                  opacity: roadBOpacity,
                  transform: [
                    { translateX: roadBTranslateX },
                    { translateY: roadBTranslateY },
                  ],
                },
              ]}
            >
              <Svg width={SCREEN_WIDTH} height={80} viewBox="0 0 360 80">
                <Path
                  d="M 70 4 C 120 18, 175 40, 240 60"
                  fill="none"
                  stroke="#38BDF8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <Path
                  d="M 110 10 C 165 28, 225 48, 295 66"
                  fill="none"
                  stroke="#FBBF24"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>

            {/* ANIMATED ACTIVE RUNNING LIGHT TRAILS (Stream C: White & Gold Speed Streaks) */}
            <Animated.View
              style={[
                styles.runningLightStream,
                {
                  opacity: roadCOpacity,
                  transform: [
                    { translateX: roadCTranslateX },
                    { translateY: roadCTranslateY },
                  ],
                },
              ]}
            >
              <Svg width={SCREEN_WIDTH} height={80} viewBox="0 0 360 80">
                <Path
                  d="M 40 2 C 90 14, 140 32, 200 50"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <Path
                  d="M 100 8 C 150 24, 205 42, 275 60"
                  fill="none"
                  stroke="#FFAA00"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>

            {/* ANIMATED ACTIVE RUNNING LIGHT TRAILS (Stream D: High-Speed Hyper-Pulse) */}
            <Animated.View
              style={[
                styles.runningLightStream,
                {
                  opacity: roadDOpacity,
                  transform: [
                    { translateX: roadDTranslateX },
                    { translateY: roadDTranslateY },
                  ],
                },
              ]}
            >
              <Svg width={SCREEN_WIDTH} height={80} viewBox="0 0 360 80">
                <Path
                  d="M 60 4 C 110 18, 160 38, 220 58"
                  fill="none"
                  stroke="#00E5FF"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
                <Path
                  d="M 90 8 C 145 25, 200 46, 270 65"
                  fill="none"
                  stroke="#FF4500"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>
          </View>

          {/* Rotating Orange Spinner & Loading Text */}
          <View style={[styles.loadingWrapper, { paddingBottom: insets.bottom + 18 }]}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Svg width={28} height={28} viewBox="0 0 32 32">
                <Circle
                  cx="16"
                  cy="16"
                  r="13"
                  stroke="rgba(234, 88, 12, 0.2)"
                  strokeWidth="3"
                  fill="none"
                />
                <Path
                  d="M 16 3 A 13 13 0 0 1 29 16"
                  stroke="#EA580C"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </Animated.View>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999,
    elevation: 999999,
    backgroundColor: "#FFFFFF",
  },
  ambientLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  topWarmGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    width: SCREEN_WIDTH * 0.75,
    height: SCREEN_HEIGHT * 0.35,
  },
  bottomCoolGlow: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.45,
  },
  contentWrapper: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
  },
  topRouteSection: {
    width: "100%",
    height: 90,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  packageContainer: {
    position: "absolute",
    left: 24,
    top: 8,
  },
  routeParticle: {
    position: "absolute",
    left: 48,
    top: 26,
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  particleGlow: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "rgba(234, 88, 12, 0.35)",
  },
  particleCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EA580C",
  },
  pinContainer: {
    position: "absolute",
    right: 28,
    top: 24,
    width: 32,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  pinRippleCircle: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(234, 88, 12, 0.4)",
  },
  pinIconWrapper: {
    width: 24,
    height: 30,
  },
  brandSection: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
  },
  logoWrapper: {
    width: 180,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  wordmark: {
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: -1,
    marginTop: -10,
  },
  wordmarkNavy: {
    color: "#052A51",
  },
  wordmarkOrange: {
    color: "#EA580C",
  },
  quickcommerceText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#052A51",
    letterSpacing: 4.5,
    marginTop: 2,
  },
  dividerPill: {
    width: 44,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#EA580C",
    marginTop: 10,
  },
  taglineWrapper: {
    marginTop: 10,
    alignItems: "center",
  },
  taglineText: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  taglineNavy: {
    color: "#052A51",
  },
  taglineOrange: {
    color: "#EA580C",
  },
  bottomSection: {
    width: "100%",
    position: "relative",
  },
  skylineWrapper: {
    width: "100%",
    alignItems: "center",
    marginBottom: -42,
  },
  roadWrapper: {
    width: "100%",
    height: 190,
    position: "relative",
    overflow: "hidden",
  },
  runningLightStream: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  loadingWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -46,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#052A51",
    letterSpacing: 0.5,
  },
});
