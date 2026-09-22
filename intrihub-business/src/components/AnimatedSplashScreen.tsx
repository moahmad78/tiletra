import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Easing,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import Svg, {
  Path,
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
  Rect,
  Polygon,
  Line as SvgLine,
  Ellipse as SvgEllipse,
  Text as SvgText,
  TSpan as SvgTSpan,
} from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SCREEN_HEIGHT = Dimensions.get("screen").height;

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

  // Animated Delivery Bike along the Wave
  const bikeProgress = useRef(new Animated.Value(0)).current;
  const bikeBounce = useRef(new Animated.Value(0)).current;

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

    // 7. Bike Riding along the curve loop (Continuous smooth drive across screen)
    Animated.loop(
      Animated.timing(bikeProgress, {
        toValue: 1,
        duration: 2600,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // 8. Bike engine vibration / suspension bounce
    Animated.loop(
      Animated.sequence([
        Animated.timing(bikeBounce, {
          toValue: -1.8,
          duration: 130,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bikeBounce, {
          toValue: 1.2,
          duration: 130,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
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

  // Bike motion interpolations along the sweeping wave curve
  const bikeTranslateX = bikeProgress.interpolate({
    inputRange: [0, 0.16, 0.32, 0.52, 0.72, 0.88, 1.0],
    outputRange: [
      -84,
      SCREEN_WIDTH * 0.125,
      SCREEN_WIDTH * 0.305,
      SCREEN_WIDTH * 0.514,
      SCREEN_WIDTH * 0.736,
      SCREEN_WIDTH * 0.944,
      SCREEN_WIDTH + 84,
    ],
  });

  const bikeTranslateY = bikeProgress.interpolate({
    inputRange: [0, 0.16, 0.32, 0.52, 0.72, 0.88, 1.0],
    outputRange: [6, -4, 12, 52, 92, 116, 132],
  });

  const bikeRotation = bikeProgress.interpolate({
    inputRange: [0, 0.16, 0.32, 0.52, 0.72, 0.88, 1.0],
    outputRange: ["-4deg", "0deg", "14deg", "22deg", "18deg", "10deg", "6deg"],
  });

  const bikeOpacity = bikeProgress.interpolate({
    inputRange: [0, 0.05, 0.95, 1.0],
    outputRange: [0, 1, 1, 0],
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

        {/* CENTER: Intrihub Original Brand Logo */}
        <Animated.View
          style={[
            styles.brandSection,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <View style={styles.logoWrapper}>
            <Image
              source={require("../../assets/intri-web-logo.png")}
              style={styles.originalLogo}
              contentFit="contain"
              transition={150}
            />
          </View>
        </Animated.View>

        {/* Tagline: "Build Better, We Deliver Faster" */}
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
            <Text style={styles.taglineNavy}>Build Better, </Text>
            <Text style={styles.taglineOrange}>We Deliver Faster</Text>
          </Text>
        </Animated.View>

        {/* BOTTOM: Dynamic Highway + Moving Light Trails + Skyline + Bike Delivery */}
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
            <Svg width={SCREEN_WIDTH} height={205} viewBox="0 0 360 205" preserveAspectRatio="none">
              <Defs>
                <SvgLinearGradient id="roadBase" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor="#1E3A5F" stopOpacity="0.4" />
                  <Stop offset="35%" stopColor="#0B2A4A" stopOpacity="0.88" />
                  <Stop offset="100%" stopColor="#041830" stopOpacity="1" />
                </SvgLinearGradient>
              </Defs>

              {/* Sweeping 3D Roadbed Geometry extending to bottom */}
              <Path
                d="M 45 42 C 70 38, 120 54, 155 78 C 210 115, 275 145, 360 160 L 360 205 L 0 205 L 0 55 C 18 48, 32 44, 45 42 Z"
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

            {/* ANIMATED DELIVERY BIKE WITH INTRIHUB BAG RIDING ON WAVE */}
            <Animated.View
              style={[
                styles.bikeWrapper,
                {
                  opacity: bikeOpacity,
                  transform: [
                    { translateX: bikeTranslateX },
                    { translateY: bikeTranslateY },
                    { rotate: bikeRotation },
                    { translateY: bikeBounce },
                  ],
                },
              ]}
            >
              <Svg width={84} height={62} viewBox="0 0 84 62">
                <Defs>
                  <SvgLinearGradient id="headlightBeam" x1="0%" y1="0%" x2="100%" y2="50%">
                    <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
                    <Stop offset="30%" stopColor="#38BDF8" stopOpacity="0.45" />
                    <Stop offset="100%" stopColor="#00F0FF" stopOpacity="0" />
                  </SvgLinearGradient>
                  <SvgLinearGradient id="bagGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor="#FB923C" />
                    <Stop offset="60%" stopColor="#EA580C" />
                    <Stop offset="100%" stopColor="#C2410C" />
                  </SvgLinearGradient>
                </Defs>

                {/* Dynamic Motion Speed Streaks Behind */}
                <Path d="M 2 27 L 11 27" stroke="#EA580C" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
                <Path d="M 0 45 L 9 45" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
                <Path d="M 6 49 L 11 49" stroke="#CBD5E1" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

                {/* Headlight beam projection */}
                <Polygon points="62,26 84,18 84,38" fill="url(#headlightBeam)" />

                {/* Rear Wheel */}
                <Circle cx="19" cy="45" r="10" fill="#0B132B" />
                <Circle cx="19" cy="45" r="6.8" fill="#1C2541" stroke="#EA580C" strokeWidth="1.6" />
                <Circle cx="19" cy="45" r="2.8" fill="#CBD5E1" />

                {/* Front Wheel */}
                <Circle cx="61" cy="45" r="10" fill="#0B132B" />
                <Circle cx="61" cy="45" r="6.8" fill="#1C2541" stroke="#EA580C" strokeWidth="1.6" />
                <Circle cx="61" cy="45" r="2.8" fill="#CBD5E1" />

                {/* Rear Mudguard */}
                <Path d="M 10 45 C 10 38, 17 33, 26 34" fill="none" stroke="#052A51" strokeWidth="3.2" strokeLinecap="round" />

                {/* Scooter Chassis Body */}
                <Path d="M 19 41 L 29 35 L 40 36 L 50 25 L 56 27 L 49 41 L 38 41 L 28 43 Z" fill="#052A51" />
                {/* Vibrant Orange Fairing Stroke */}
                <Path d="M 30 35 L 40 35 L 48 26 L 45 24 L 37 33 L 29 33 Z" fill="#EA580C" />

                {/* Front Fork & Steering */}
                <SvgLine x1="61" y1="45" x2="52" y2="21" stroke="#64748B" strokeWidth="2.6" strokeLinecap="round" />
                {/* Handlebars */}
                <Path d="M 48 20 L 55 21 L 53 23" fill="none" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                {/* Headlight Pod */}
                <SvgEllipse cx="57" cy="27" rx="2.5" ry="3.5" fill="#00F0FF" />

                {/* Rider Legs and Boots */}
                <Path d="M 33 31 L 38 39 L 44 39" fill="none" stroke="#0F172A" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />

                {/* Rider Body & Arms reaching Handlebars */}
                <Path d="M 32 27 L 41 21 L 51 21" fill="none" stroke="#052A51" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Orange Collar/Shoulder Accent */}
                <Circle cx="39" cy="21" r="2.6" fill="#EA580C" />

                {/* Rider Helmet */}
                <Circle cx="45" cy="13" r="7.5" fill="#EA580C" />
                {/* Helmet Tinted Visor */}
                <Path d="M 47 10 C 51 11, 51 15, 48 17" fill="none" stroke="#0B132B" strokeWidth="2.6" strokeLinecap="round" />
                <Path d="M 48 11.5 C 50 12.5, 50 14.5, 48 15" stroke="#FFFFFF" strokeWidth="1.1" strokeLinecap="round" opacity="0.85" />

                {/* INTRIHUB DELIVERY BACKPACK BAG */}
                <Rect x="16" y="12" width="19" height="22" rx="3.5" fill="url(#bagGrad)" stroke="#C2410C" strokeWidth="1" />
                {/* Navy Straps & Trim */}
                <Rect x="16" y="15" width="2.2" height="19" fill="#052A51" />
                <Rect x="32.8" y="15" width="2.2" height="19" fill="#052A51" />
                {/* Top Handle */}
                <Path d="M 21.5 12 C 21.5 9, 29.5 9, 29.5 12" fill="none" stroke="#052A51" strokeWidth="1.8" strokeLinecap="round" />
                {/* Silver Reflective Strip */}
                <Rect x="18.2" y="27" width="14.6" height="2.6" rx="1.2" fill="#FFFFFF" opacity="0.95" />
                {/* Intrihub Bag Logo Badge */}
                <Rect x="18.5" y="16" width="14" height="8.5" rx="1.8" fill="#FFFFFF" />
                <SvgText x="25.5" y="22" fontSize="3.8" fontWeight="900" fill="#052A51" textAnchor="middle">
                  intri<SvgTSpan fill="#EA580C">hub</SvgTSpan>
                </SvgText>
              </Svg>
            </Animated.View>
          </View>

          {/* Solid deep navy anchor filling all the way to the very bottom */}
          <View style={[styles.bottomNavyBase, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
            <View style={styles.loadingWrapper}>
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Svg width={26} height={26} viewBox="0 0 32 32">
                  <Circle
                    cx="16"
                    cy="16"
                    r="13"
                    stroke="rgba(255, 255, 255, 0.2)"
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
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: 999999,
    elevation: 999999,
    backgroundColor: "#FFFFFF",
  },
  ambientLayer: {
    ...StyleSheet.absoluteFill,
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
    marginTop: -15,
  },
  logoWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  originalLogo: {
    width: 250,
    height: 74,
  },
  taglineWrapper: {
    marginTop: 6,
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
    height: 205,
    position: "relative",
    overflow: "hidden",
  },
  bikeWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 84,
    height: 62,
    zIndex: 20,
  },
  runningLightStream: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  bottomNavyBase: {
    width: "100%",
    backgroundColor: "#041830",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
  },
  loadingWrapper: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#CBD5E1",
    letterSpacing: 0.5,
  },
});
