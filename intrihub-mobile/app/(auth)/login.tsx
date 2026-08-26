import { useState } from "react";
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
import { ArrowLeft, ShieldCheck, Mail, Phone } from "lucide-react-native";
import { COLORS, SPACING, RADIUS } from "../../src/constants/theme";
import { sendOtp, verifyOtp, loginWithPhoneOrEmail } from "../../src/api/auth";
import { useAuthStore } from "../../src/store/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [step, setStep] = useState<"input" | "otp">("input");
  const [identifier, setIdentifier] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(60);

  const isEmail = identifier.includes("@");

  const handleSendOtp = async () => {
    setError("");
    const clean = identifier.trim();
    if (!clean) {
      setError("Please enter your mobile number or email address");
      return;
    }

    if (!clean.includes("@") && clean.replace(/\D/g, "").length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);
    try {
      if (isEmail) {
        const res = await sendOtp(clean);
        if (!res.success) {
          setError(res.error || "Failed to send OTP. Please try again.");
          setLoading(false);
          return;
        }
        setStep("otp");
      } else {
        // Direct phone fast login or OTP step
        const loginRes = await loginWithPhoneOrEmail(clean, name.trim() || undefined);
        if (loginRes.success && loginRes.user) {
          setUser(loginRes.user);
          router.back();
          return;
        } else {
          setError(loginRes.error || "Failed to log in");
        }
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
        emailOrPhone: identifier.trim(),
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

            <Text style={styles.label}>Full Name (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Rahul Sharma"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Mobile Number or Email *</Text>
            <View style={styles.inputWithIcon}>
              {isEmail ? (
                <Mail size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
              ) : (
                <Phone size={18} color={COLORS.textMuted} style={styles.fieldIcon} />
              )}
              <TextInput
                style={styles.inputIconText}
                placeholder="10-digit phone or email"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                keyboardType={isEmail ? "email-address" : "phone-pad"}
              />
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSendOtp}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textWhite} />
              ) : (
                <Text style={styles.primaryButtonText}>Continue</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.formHeading}>Enter Verification Code</Text>
            <Text style={styles.formSub}>
              We have sent a 6-digit code to <Text style={styles.highlight}>{identifier}</Text>
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
              activeOpacity={0.8}
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
              <Text style={styles.changeBtnText}>Change Email / Phone</Text>
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
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(5, 42, 81, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: COLORS.primary,
  },
  brandSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
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
    marginBottom: 20,
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
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 16,
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  fieldIcon: {
    marginRight: 8,
  },
  inputIconText: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
  },
  otpInput: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 14,
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.primary,
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 20,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: COLORS.textWhite,
    fontSize: 15,
    fontWeight: "800",
  },
  changeBtn: {
    alignItems: "center",
    marginTop: 16,
  },
  changeBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  termsText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: "center",
    marginTop: 24,
    lineHeight: 16,
  },
});
