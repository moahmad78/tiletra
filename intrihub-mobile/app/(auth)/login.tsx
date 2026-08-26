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
} from "react-native";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { ArrowLeft, ShieldCheck, Mail, Phone, Lock } from "lucide-react-native";
import { COLORS, SPACING, RADIUS } from "../../src/constants/theme";
import { sendOtp, verifyOtp, loginWithPhoneOrEmail, loginWithGoogle } from "../../src/api/auth";
import { useAuthStore } from "../../src/store/authStore";

WebBrowser.maybeCompleteAuthSession();

// Google Client ID shared with the Intrihub web application
const GOOGLE_CLIENT_ID = "602084779648-k1gfeq3u4vein82tvt93d1iv5t43b8oh.apps.googleusercontent.com";

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [authMode, setAuthMode] = useState<"phone" | "email">("phone");
  const [step, setStep] = useState<"input" | "otp">("input");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Google OAuth Request
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: GOOGLE_CLIENT_ID,
    webClientId: GOOGLE_CLIENT_ID,
    scopes: ["profile", "email"],
  });

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

  const handlePhoneSubmit = async () => {
    setError("");
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithPhoneOrEmail(cleanPhone, name.trim() || undefined);
      if (res.success && res.user) {
        setUser(res.user);
        router.back();
      } else {
        setError(res.error || "Failed to sign in with phone number");
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async () => {
    setError("");
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await sendOtp(cleanEmail);
      if (res.success) {
        setStep("otp");
      } else {
        setError(res.error || "Failed to send verification code. Please try again.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to send OTP. Please try again.");
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
        setError(res.error || "Invalid verification code");
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || "Failed to verify code");
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePress = () => {
    setError("");
    if (!request) {
      setError("Google Sign-In is initializing. Please try again in a moment.");
      return;
    }
    promptAsync();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Top Header */}
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={22} color={COLORS.text} />
        </TouchableOpacity>

        {/* Brand Banner */}
        <View style={styles.brandSection}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={36} color={COLORS.primary} />
          </View>
          <Text style={styles.brandTitle}>Welcome to Intrihub</Text>
          <Text style={styles.brandSubtitle}>
            India's interior & construction supply marketplace
          </Text>
        </View>

        {/* Error Message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {step === "input" ? (
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Sign In or Register</Text>
            <Text style={styles.formSub}>Enter your details to proceed with your orders</Text>

            {/* Mode Switcher: Phone vs Email Tabs */}
            <View style={styles.toggleContainer}>
              <TouchableOpacity
                style={[styles.toggleBtn, authMode === "phone" && styles.toggleBtnActive]}
                onPress={() => {
                  setAuthMode("phone");
                  setError("");
                }}
                activeOpacity={0.8}
              >
                <Phone
                  size={15}
                  color={authMode === "phone" ? COLORS.primary : COLORS.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.toggleText, authMode === "phone" && styles.toggleTextActive]}>
                  Phone Number
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, authMode === "email" && styles.toggleBtnActive]}
                onPress={() => {
                  setAuthMode("email");
                  setError("");
                }}
                activeOpacity={0.8}
              >
                <Mail
                  size={15}
                  color={authMode === "email" ? COLORS.primary : COLORS.textMuted}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.toggleText, authMode === "email" && styles.toggleTextActive]}>
                  Email Address
                </Text>
              </TouchableOpacity>
            </View>

            {/* Optional Full Name Field */}
            <Text style={styles.label}>Full Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChangeText={setName}
            />

            {/* Phone Input View */}
            {authMode === "phone" ? (
              <View>
                <Text style={styles.label}>10-Digit Mobile Number *</Text>
                <View style={styles.inputWithIcon}>
                  <Text style={styles.countryCode}>+91</Text>
                  <TextInput
                    style={styles.inputIconText}
                    placeholder="Enter mobile number"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handlePhoneSubmit}
                  disabled={loading || googleLoading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.textWhite} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Continue with Phone</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* Email Input View */
              <View>
                <Text style={styles.label}>Email Address *</Text>
                <View style={styles.inputWithIcon}>
                  <Mail size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
                  <TextInput
                    style={styles.inputIconText}
                    placeholder="name@example.com"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleEmailSubmit}
                  disabled={loading || googleLoading}
                  activeOpacity={0.85}
                >
                  {loading ? (
                    <ActivityIndicator color={COLORS.textWhite} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Send Verification Code</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Continue with Google Button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGooglePress}
              disabled={loading || googleLoading}
              activeOpacity={0.85}
            >
              {googleLoading ? (
                <ActivityIndicator color={COLORS.primary} size="small" />
              ) : (
                <View style={styles.googleBtnContent}>
                  <View style={styles.googleIconBadge}>
                    <Text style={styles.googleGText}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>Continue with Google</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* OTP Verification Step */
          <View style={styles.formCard}>
            <View style={styles.otpHeaderIcon}>
              <Lock size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.formHeading}>Enter 6-Digit Code</Text>
            <Text style={styles.formSub}>
              We have sent a verification code to <Text style={styles.highlight}>{email}</Text>
            </Text>

            <TextInput
              style={styles.otpInput}
              placeholder="••••••"
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
                <ActivityIndicator color={COLORS.textWhite} />
              ) : (
                <Text style={styles.primaryButtonText}>Verify & Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.changeBtn}
              onPress={() => setStep("input")}
              disabled={loading}
            >
              <Text style={styles.changeBtnText}>Change Email Address</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.termsText}>
          By continuing, you agree to Intrihub's Terms of Use and Privacy Policy.
        </Text>
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
    paddingTop: Platform.OS === "android" ? 48 : 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primary,
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
    textAlign: "center",
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
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  formHeading: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
  },
  formSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 18,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
  },
  toggleBtnActive: {
    backgroundColor: COLORS.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textMuted,
  },
  toggleTextActive: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  highlight: {
    fontWeight: "700",
    color: COLORS.primary,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 6,
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
    marginBottom: 14,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  countryCode: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginRight: 10,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingRight: 8,
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
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryButtonText: {
    color: COLORS.textWhite,
    fontSize: 14,
    fontWeight: "800",
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
    fontWeight: "700",
    color: COLORS.textMuted,
    marginHorizontal: 12,
  },
  googleButton: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  googleBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleIconBadge: {
    width: 22,
    height: 22,
    borderRadius: RADIUS.full,
    backgroundColor: "#ea4335",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  googleGText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },
  googleButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  otpHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  otpInput: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 13,
    fontSize: 22,
    fontWeight: "800",
    color: COLORS.primary,
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 18,
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
    marginTop: 22,
    lineHeight: 16,
  },
});
