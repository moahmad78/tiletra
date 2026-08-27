import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import Svg, { Path } from "react-native-svg";
import { ArrowLeft, ShieldCheck, Mail, ArrowRight, RotateCw, Lock, ChevronLeft } from "lucide-react-native";
import { COLORS, SPACING, RADIUS, SHADOWS } from "../../src/constants/theme";
import { sendOtp, verifyOtp, loginWithGoogle } from "../../src/api/auth";
import { setStoredTokens } from "../../src/api/client";
import { useAuthStore } from "../../src/store/authStore";

WebBrowser.maybeCompleteAuthSession();

// Google Client IDs supporting Web, Android Native and iOS
const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  "602084779648-k1gfeq3u4vein82tvt93d1iv5t43b8oh.apps.googleusercontent.com";

const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  "602084779648-bchh5lt1n03g719qisutva4bkhjg17cb.apps.googleusercontent.com";

const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  "602084779648-omckasog9cejsf7d0p84d0aomanm7c5d.apps.googleusercontent.com";

function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <Path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <Path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <Path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </Svg>
  );
}

import Constants, { ExecutionEnvironment } from "expo-constants";

// Detect if running inside standard Expo Go app
const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [step, setStep] = useState<"input" | "otp">("input");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const redirectUri = __DEV__
    ? "https://auth.expo.io/@sahil_sheikh78/intrihub"
    : AuthSession.makeRedirectUri({
        scheme: "intrihub",
      });

  // Google OAuth Request:
  // In development, uses Web Client ID with Expo Auth Proxy.
  // In standalone production/preview builds, uses native Android and iOS Client IDs.
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: __DEV__ ? undefined : GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: __DEV__ ? undefined : GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    clientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ["profile", "email"],
    redirectUri,
  });

  useEffect(() => {
    console.log("[Google OAuth] Configured Redirect URI:", redirectUri);
  }, [redirectUri]);

  // Countdown timer for OTP
  useEffect(() => {
    if (step !== "otp") return;
    if (timer <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [step, timer]);

  // Handle Google OAuth Response
  useEffect(() => {
    async function handleGoogleResponse() {
      if (response?.type === "success") {
        const { authentication } = response;
        const accessToken = authentication?.accessToken;
        const idToken = authentication?.idToken;

        if (accessToken || idToken) {
          setGoogleLoading(true);
          setError("");
          try {
            const res = await loginWithGoogle({ accessToken, idToken });
            if (res.success && res.user) {
              setUser(res.user);
              router.back();
            } else {
              setError(res.error || "Google login failed. Please try again.");
            }
          } catch (err: any) {
            setError(err?.response?.data?.error || err.message || "Failed to complete Google Sign In");
          } finally {
            setGoogleLoading(false);
          }
        }
      } else if (response?.type === "error") {
        setError(response.error?.message || "Google authentication was cancelled or failed");
      }
    }

    handleGoogleResponse();
  }, [response]);

  const handleEmailSubmit = async () => {
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(cleanEmail);
      if (res.success) {
        setStep("otp");
        setTimer(60);
        setCanResend(false);
      } else {
        setError(res.error || "Failed to send verification code. Please try again.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp({
        emailOrPhone: email.trim().toLowerCase(),
        otp: cleanOtp,
        name: name.trim() || undefined,
      });

      if (res.success && res.user) {
        setUser(res.user);
        router.back();
      } else {
        setError(res.error || "Invalid verification code. Please try again.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await sendOtp(email.trim().toLowerCase());
      if (res.success) {
        setTimer(60);
        setCanResend(false);
        setOtp("");
      } else {
        setError(res.error || "Failed to resend code");
      }
    } catch (err: any) {
      setError("Failed to resend verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      if (Platform.OS === "web") {
        if (typeof window !== "undefined") {
          window.location.href = "https://www.intrihub.com/api/auth/google";
        }
        return;
      }

      // Direct WebBrowser OAuth via verified website endpoint
      // Google Cloud Console already has https://www.intrihub.com/api/auth/callback/google 100% verified and active.
      // This guarantees seamless Google Login in Expo Go, Android APK, and iOS without any proxy redirect_uri_mismatch errors.
      const authUrl = "https://www.intrihub.com/api/auth/google?intent=mobile";
      const redirectUrl = "intrihub://oauth";

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type === "success" && result.url) {
        const urlStr = result.url;
        const queryIndex = urlStr.indexOf("?");
        if (queryIndex !== -1) {
          const queryString = urlStr.substring(queryIndex + 1);
          const params = new URLSearchParams(queryString);
          const accessToken = params.get("accessToken");
          const refreshToken = params.get("refreshToken");
          const userRaw = params.get("user");

          if (accessToken && refreshToken && userRaw) {
            const userObj = JSON.parse(decodeURIComponent(userRaw));
            await setStoredTokens(accessToken, refreshToken);
            setUser(userObj);
            router.back();
            return;
          }
        }
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      setError(err?.message || "Google Sign-In was cancelled or failed.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleTermsOfUse = () => {
    router.push("/terms" as any);
  };

  const handlePrivacyPolicy = () => {
    router.push("/privacy" as any);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header Row */}
        <View style={styles.topNav}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (step === "otp") {
                setStep("input");
                setOtp("");
                setError("");
              } else {
                router.back();
              }
            }}
          >
            {step === "otp" ? (
              <ChevronLeft size={20} color={COLORS.text} />
            ) : (
              <ArrowLeft size={20} color={COLORS.text} />
            )}
          </TouchableOpacity>

          <View style={styles.badgeRow}>
            <View style={styles.secureBadge}>
              <ShieldCheck size={13} color={COLORS.accentOrange} style={{ marginRight: 4 }} />
              <Text style={styles.secureBadgeText}>Secure Login</Text>
            </View>
          </View>
        </View>

        {/* Brand Banner */}
        <View style={styles.brandSection}>
          <View style={styles.logoRow}>
            <Image
              source={require("../../assets/intri-web-logo.png")}
              style={styles.brandLogo}
              contentFit="contain"
              transition={150}
            />
          </View>
          <Text style={styles.brandTitle}>
            {step === "input" ? "Welcome to Intrihub" : "Verify Your Email"}
          </Text>
          <Text style={styles.brandSubtitle}>
            {step === "input"
              ? "India's interior & construction supply marketplace"
              : `We've sent a 6-digit verification code to ${email}`}
          </Text>
        </View>

        {/* Error Alert */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {step === "input" ? (
          <View style={[styles.formCard, SHADOWS.sm]}>
            {/* 1. Continue with Google Button (Top Primary) */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGooglePress}
              disabled={loading || googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <>
                  <View style={styles.googleLeft}>
                    <GoogleIcon />
                    <Text style={styles.googleButtonText}>Continue with Google</Text>
                  </View>
                  <View style={styles.fastestBadge}>
                    <Text style={styles.fastestText}>FASTEST</Text>
                  </View>
                </>
              )}
            </TouchableOpacity>

            {/* 2. Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 3. Email Input */}
            <Text style={styles.label}>Work or Personal Email *</Text>
            <View style={styles.inputWithIcon}>
              <Mail size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
              <TextInput
                style={styles.inputIconText}
                placeholder="name@example.com"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoCorrect={false}
              />
            </View>

            {/* Optional Full Name Input */}
            <Text style={styles.label}>Full Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
            />

            {/* 4. Continue with Email Button */}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleEmailSubmit}
              disabled={loading || googleLoading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textWhite} size="small" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.primaryButtonText}>Continue with Email OTP</Text>
                  <ArrowRight size={16} color={COLORS.textWhite} style={{ marginLeft: 8 }} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* OTP Verification Step */
          <View style={[styles.formCard, SHADOWS.sm]}>
            <View style={styles.otpHeaderIcon}>
              <Lock size={26} color={COLORS.primary} />
            </View>
            <Text style={styles.formHeading}>Enter 6-Digit Code</Text>
            <Text style={styles.formSub}>
              Enter the code sent to <Text style={styles.highlight}>{email}</Text>
            </Text>

            <TextInput
              style={styles.otpInput}
              placeholder="••••••"
              placeholderTextColor="#94a3b8"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
              autoFocus
            />

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleVerifyOtp}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textWhite} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Verify & Sign In</Text>
              )}
            </TouchableOpacity>

            {/* Resend Timer / Action */}
            <View style={styles.resendRow}>
              {canResend ? (
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={loading}
                  style={styles.resendBtn}
                >
                  <RotateCw size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.resendText}>Resend Code</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.timerText}>
                  Resend code in <Text style={styles.timerCount}>{timer}s</Text>
                </Text>
              )}
            </View>

            <TouchableOpacity
              style={styles.changeBtn}
              onPress={() => {
                setStep("input");
                setOtp("");
                setError("");
              }}
              disabled={loading}
            >
              <Text style={styles.changeBtnText}>Back to Email Entry</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.termsText}>
          By continuing, you agree to Intrihub's{"\n"}
          <Text style={styles.termsLink} onPress={handleTermsOfUse}>
            Terms of Use
          </Text>{" "}
          and{" "}
          <Text style={styles.termsLink} onPress={handlePrivacyPolicy}>
            Privacy Policy
          </Text>
          .
        </Text>

        {/* Founder & Developer Credit Footer */}
        <View style={styles.creditSection}>
          <Text style={styles.creditText}>Developed by Sahil Sheikh</Text>
          <Text style={styles.creditText}>Founder & CEO — Sahil Sheikh</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.xl,
    paddingTop: Platform.OS === "android" ? 44 : 20,
  },
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  intriBadge: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
    marginRight: 8,
  },
  intriBadgeText: {
    color: COLORS.textWhite,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  secureBadge: {
    flexDirection: "row",
    alignItems: "center",
  },
  secureBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
  },
  brandSection: {
    marginBottom: 24,
  },
  logoRow: {
    alignItems: "flex-start",
    marginBottom: 14,
  },
  brandLogo: {
    width: 140,
    height: 38,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: COLORS.primary,
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  errorText: {
    backgroundColor: "#fee2e2",
    color: COLORS.error,
    padding: 12,
    borderRadius: RADIUS.md,
    marginBottom: 16,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  googleLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  googleButtonText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 12,
  },
  fastestBadge: {
    backgroundColor: COLORS.accentOrange,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: RADIUS.sm,
  },
  fastestText: {
    color: COLORS.textWhite,
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: "800",
    color: COLORS.textMuted,
    marginHorizontal: 12,
    letterSpacing: 0.8,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  fieldIcon: {
    marginRight: 8,
  },
  inputIconText: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.text,
  },
  input: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 18,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "800",
  },
  otpHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
  },
  formHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  formSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 18,
    textAlign: "center",
  },
  highlight: {
    fontWeight: "700",
    color: COLORS.primary,
  },
  otpInput: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 13,
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.primary,
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 18,
  },
  resendRow: {
    alignItems: "center",
    marginTop: 14,
  },
  resendBtn: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "800",
  },
  timerText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  timerCount: {
    fontWeight: "800",
    color: COLORS.primary,
  },
  changeBtn: {
    alignItems: "center",
    marginTop: 14,
  },
  changeBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  termsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 20,
    lineHeight: 16,
  },
  termsLink: {
    color: COLORS.primary,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  creditSection: {
    marginTop: 18,
    paddingBottom: 24,
    alignItems: "center",
  },
  creditText: {
    fontSize: 11,
    fontWeight: "500",
    color: COLORS.textMuted,
    lineHeight: 16,
  },
});
