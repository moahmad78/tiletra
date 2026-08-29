import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import Svg, { Path } from "react-native-svg";
import {
  ShieldCheck,
  Building2,
  Mail,
  ArrowRight,
  ArrowLeft,
  Lock,
  Headphones,
  UserPlus,
  ChevronRight,
  AlertTriangle,
  Clock,
  ExternalLink,
  Store,
  HelpCircle,
  XCircle,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react-native";
import { loginWithGoogle, sendOtp, verifyOtp, checkAuthMethod, loginWithPassword } from "../../src/api/auth";
import { useAuthStore } from "../../src/store/authStore";
import { COLORS, SHADOWS } from "../../src/constants/theme";

const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  "602084779648-k1gfeq3u4vein82tvt93d1iv5t43b8oh.apps.googleusercontent.com";
const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  "602084779648-bdifn2cbd0n0tp3qq1elju4iqh6hvb5a.apps.googleusercontent.com";
const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";

// Official Google 4-Color 'G' Logo
function GoogleOfficialIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
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

export default function BusinessLoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setUser } = useAuthStore();

  const [step, setStep] = useState<"input" | "otp" | "password" | "unapproved">("input");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Dedicated Unapproved / Not Found state
  const [unapprovedDetails, setUnapprovedDetails] = useState<{
    reason: "NOT_FOUND" | "PENDING_APPROVAL" | "SUSPENDED" | "REJECTED" | "UNAPPROVED";
    message: string;
    vendorName?: string;
    attemptedEmail: string;
  }>({
    reason: "NOT_FOUND",
    message: "",
    attemptedEmail: "",
  });

  // Brute-force IP Lockout countdown state
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const redirectUri = __DEV__
    ? "https://auth.expo.io/@sahil_sheikh78/intrihub-business"
    : AuthSession.makeRedirectUri({
        scheme: "intrihub-biz",
      });

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: __DEV__ ? undefined : GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: __DEV__ ? undefined : GOOGLE_IOS_CLIENT_ID,
    webClientId: GOOGLE_WEB_CLIENT_ID,
    clientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ["profile", "email"],
    redirectUri,
  });

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

  // Countdown timer for IP Lockout
  useEffect(() => {
    if (!isLocked || lockoutSeconds <= 0) {
      if (isLocked && lockoutSeconds <= 0) {
        setIsLocked(false);
        setError("");
      }
      return;
    }
    const interval = setInterval(() => {
      setLockoutSeconds((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setError("");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLocked, lockoutSeconds]);

  const handleLockoutResponse = (errData: any) => {
    if (errData?.locked === true) {
      const seconds = errData.retryAfterSeconds || 900;
      setIsLocked(true);
      setLockoutSeconds(seconds);
    }
  };

  const formatLockoutTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleRoleRouting = (user: any) => {
    setUser(user);
    if (user.role === "vendor") {
      router.replace("/(vendor)/dashboard" as any);
    } else if (user.role === "admin" || user.role === "superadmin") {
      router.replace("/(admin)/dashboard" as any);
    } else {
      router.replace("/(auth)/blocked" as any);
    }
  };

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
              handleRoleRouting(res.user);
            } else {
              handleLockoutResponse(res);
              if (res.reason) {
                setUnapprovedDetails({
                  reason: (res.reason as any) || "NOT_FOUND",
                  message: res.error || "This Google account is not registered as an approved vendor.",
                  vendorName: (res as any).vendorName,
                  attemptedEmail: (res as any).email || "Google Account",
                });
                setStep("unapproved");
              } else {
                setError(res.error || "Google sign-in failed. Please try again.");
              }
            }
          } catch (err: any) {
            const errData = err?.response?.data;
            handleLockoutResponse(errData);
            if (errData?.reason) {
              setUnapprovedDetails({
                reason: errData.reason,
                message: errData.error || "This Google account is not registered as an approved vendor.",
                vendorName: errData.vendorName,
                attemptedEmail: errData.email || "Google Account",
              });
              setStep("unapproved");
            } else {
              setError(errData?.error || err.message || "Failed to complete Google Sign In");
            }
          } finally {
            setGoogleLoading(false);
          }
        }
      }
    }
    handleGoogleResponse();
  }, [response]);

  const handleSendOtp = async () => {
    if (isLocked) return;
    if (!email.trim()) {
      setError("Please enter your business email");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // 1. Dynamic pre-auth method lookup
      const methodCheck = await checkAuthMethod(email.trim());

      if (!methodCheck.success) {
        handleLockoutResponse(methodCheck);
        if (methodCheck.reason) {
          setUnapprovedDetails({
            reason: methodCheck.reason,
            message: methodCheck.error || "This email is not registered as an approved vendor.",
            vendorName: methodCheck.vendorName,
            attemptedEmail: email.trim(),
          });
          setStep("unapproved");
        } else {
          setError(methodCheck.error || "Failed to verify vendor account");
        }
        return;
      }

      // 2. If vendor configured for password login
      if (methodCheck.loginMethod === "password") {
        setStep("password");
        setPassword("");
        return;
      }

      // 3. If vendor configured for OTP login (default)
      const res = await sendOtp(email.trim());
      if (res.success) {
        setStep("otp");
        setTimer(60);
        setCanResend(false);
      } else {
        handleLockoutResponse(res);
        if (res.reason) {
          setUnapprovedDetails({
            reason: res.reason,
            message: res.error || "This email is not registered as an approved vendor.",
            vendorName: res.vendorName,
            attemptedEmail: email.trim(),
          });
          setStep("unapproved");
        } else {
          setError(res.error || "Failed to send OTP code.");
        }
      }
    } catch (err: any) {
      const errData = err?.response?.data;
      handleLockoutResponse(errData);
      if (errData?.reason) {
        setUnapprovedDetails({
          reason: errData.reason,
          message: errData.error || "This email is not registered as an approved vendor.",
          vendorName: errData.vendorName,
          attemptedEmail: email.trim(),
        });
        setStep("unapproved");
      } else {
        setError(errData?.error || err.message || "Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordLogin = async () => {
    if (isLocked) return;
    if (!password) {
      setError("Please enter your vendor password");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await loginWithPassword({
        email: email.trim(),
        password,
      });

      if (res.success && res.user) {
        handleRoleRouting(res.user);
      } else {
        handleLockoutResponse(res);
        setError(res.error || "Invalid password. Please try again.");
      }
    } catch (err: any) {
      const errData = err?.response?.data;
      handleLockoutResponse(errData);
      setError(errData?.error || err.message || "Password login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (isLocked) return;
    if (otp.length < 4) {
      setError("Please enter the 6-digit OTP code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await verifyOtp({
        emailOrPhone: email.trim(),
        otp: otp.trim(),
        name: name.trim() || undefined,
      });

      if (res.success && res.user) {
        handleRoleRouting(res.user);
      } else {
        handleLockoutResponse(res);
        setError(res.error || "Invalid verification code");
      }
    } catch (err: any) {
      const errData = err?.response?.data;
      handleLockoutResponse(errData);
      setError(errData?.error || err.message || "OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header Hero with Official Intrihub Brand Logo */}
        <View style={styles.headerHero}>
          <View style={styles.logoBadgeBox}>
            <Image
              source={require("../../assets/intri-icon.png")}
              style={styles.brandIconImage}
              contentFit="contain"
            />
          </View>

          <View style={styles.badgeContainer}>
            <Building2 size={13} color={COLORS.accentOrange} />
            <Text style={styles.badgeText}>BUSINESS PORTAL</Text>
          </View>

          <Text style={styles.brandSubtitle}>
            Vendor Operations & Store Management Console
          </Text>
        </View>

        {/* Main Authentication Card */}
        <View style={styles.formCard}>
          {/* IP Lockout Countdown Banner */}
          {isLocked ? (
            <View style={styles.lockoutBanner}>
              <View style={styles.lockoutHeader}>
                <AlertTriangle size={18} color="#DC2626" />
                <Text style={styles.lockoutTitle}>Security Lockout Active</Text>
              </View>
              <Text style={styles.lockoutSubtitle}>
                Too many failed login attempts. Further attempts from this IP are blocked for security.
              </Text>
              <View style={styles.countdownBadge}>
                <Clock size={16} color="#DC2626" />
                <Text style={styles.countdownText}>
                  Try again in {formatLockoutTime(lockoutSeconds)}
                </Text>
              </View>
            </View>
          ) : null}

          {/* Standard Error Alert */}
          {error && !isLocked ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {step === "input" ? (
            <View>
              {/* Official Google Button with 4-Color G Logo */}
              <TouchableOpacity
                style={[styles.googleBtn, isLocked && styles.btnDisabled]}
                onPress={() => promptAsync()}
                disabled={googleLoading || !request || isLocked}
                activeOpacity={0.85}
              >
                {googleLoading ? (
                  <ActivityIndicator size="small" color={COLORS.text} />
                ) : (
                  <>
                    <View style={styles.googleIconWrapper}>
                      <GoogleOfficialIcon />
                    </View>
                    <Text style={[styles.googleBtnText, isLocked && styles.textDisabled]}>
                      Continue with Google
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR BUSINESS EMAIL</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Clean Single-Line Email Input */}
              <Text style={styles.inputLabel}>Business Email</Text>
              <View style={[styles.inputWrapper, isLocked && styles.inputWrapperDisabled]}>
                <Mail size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="vendor@company.com"
                  placeholderTextColor={COLORS.textTertiary}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setError("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLocked}
                />
              </View>

              {/* Representative Name */}
              <Text style={styles.inputLabel}>Representative Name (Optional)</Text>
              <View style={[styles.inputWrapper, isLocked && styles.inputWrapperDisabled]}>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. IntriHub"
                  placeholderTextColor={COLORS.textTertiary}
                  value={name}
                  onChangeText={setName}
                  editable={!isLocked}
                />
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.primaryBtn, isLocked && styles.primaryBtnDisabled]}
                onPress={handleSendOtp}
                disabled={loading || isLocked}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>Continue to Login</Text>
                    <ArrowRight size={18} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>

              {/* Access Note */}
              <View style={styles.accessNote}>
                <ShieldCheck size={16} color="#10B981" />
                <Text style={styles.accessNoteText}>
                  Restricted Access: Whitelisted vendor partners & store managers only.
                </Text>
              </View>
            </View>
          ) : step === "password" ? (
            <View>
              <Text style={styles.otpHeading}>Enter Password</Text>
              <Text style={styles.otpSubtitle}>
                Logging into account <Text style={{ fontWeight: "700", color: COLORS.primary }}>{email}</Text>
              </Text>

              <View style={[styles.inputWrapper, isLocked && styles.inputWrapperDisabled]}>
                <Lock size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 40 }]}
                  placeholder="Enter your vendor password"
                  placeholderTextColor={COLORS.textTertiary}
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setError("");
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isLocked}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: 12, top: 14 }}
                >
                  {showPassword ? <EyeOff size={18} color={COLORS.textSecondary} /> : <Eye size={18} color={COLORS.textSecondary} />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, isLocked && styles.primaryBtnDisabled]}
                onPress={handlePasswordLogin}
                disabled={loading || isLocked}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <KeyRound size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryBtnText}>Sign In with Password</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backToInputBtn}
                onPress={() => {
                  setStep("input");
                  setError("");
                  setPassword("");
                }}
              >
                <Text style={styles.backToInputText}>Change Email Address</Text>
              </TouchableOpacity>
            </View>
          ) : step === "otp" ? (
            <View>
              <Text style={styles.otpHeading}>Enter 6-Digit Code</Text>
              <Text style={styles.otpSubtitle}>
                We sent a secure verification code to{" "}
                <Text style={{ fontWeight: "700", color: COLORS.primary }}>{email}</Text>
              </Text>

              <View style={[styles.inputWrapper, isLocked && styles.inputWrapperDisabled]}>
                <Lock size={18} color={COLORS.textSecondary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { letterSpacing: 8, fontSize: 20, fontWeight: "700" }]}
                  placeholder="••••••"
                  placeholderTextColor={COLORS.textTertiary}
                  value={otp}
                  onChangeText={(val) => {
                    setOtp(val.replace(/[^0-9]/g, ""));
                    setError("");
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!isLocked}
                />
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, isLocked && styles.primaryBtnDisabled]}
                onPress={handleVerifyOtp}
                disabled={loading || isLocked}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Verify & Enter Portal</Text>
                )}
              </TouchableOpacity>

              <View style={styles.resendRow}>
                {canResend && !isLocked ? (
                  <TouchableOpacity onPress={handleSendOtp}>
                    <Text style={styles.resendTextActive}>Resend Verification Code</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.resendTextInactive}>
                    {isLocked ? "Resend unavailable during lockout" : `Resend code in ${timer}s`}
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.backToInputBtn}
                onPress={() => {
                  setStep("input");
                  setError("");
                }}
              >
                <Text style={styles.backToInputText}>Change Email Address</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Dedicated Unapproved / Not Registered Screen */
            <View style={styles.unapprovedContainer}>
              <View
                style={[
                  styles.unapprovedIconBox,
                  unapprovedDetails.reason === "PENDING_APPROVAL"
                    ? { backgroundColor: "#FEF3C7" }
                    : unapprovedDetails.reason === "SUSPENDED" || unapprovedDetails.reason === "REJECTED"
                    ? { backgroundColor: "#FEE2E2" }
                    : { backgroundColor: "#FFF7ED" },
                ]}
              >
                {unapprovedDetails.reason === "PENDING_APPROVAL" ? (
                  <Clock size={36} color="#D97706" />
                ) : unapprovedDetails.reason === "SUSPENDED" || unapprovedDetails.reason === "REJECTED" ? (
                  <AlertTriangle size={36} color="#DC2626" />
                ) : (
                  <Building2 size={36} color="#EA580C" />
                )}
              </View>

              <Text style={styles.unapprovedTitle}>
                {unapprovedDetails.reason === "PENDING_APPROVAL"
                  ? "Application Under Review"
                  : unapprovedDetails.reason === "SUSPENDED"
                  ? "Account Suspended"
                  : unapprovedDetails.reason === "REJECTED"
                  ? "Application Not Approved"
                  : "Email Not Registered"}
              </Text>

              <Text style={styles.unapprovedSubtitle}>
                {unapprovedDetails.message}
              </Text>

              {/* Attempted Email Badge */}
              <View style={styles.emailBadge}>
                <Mail size={13} color={COLORS.textSecondary} />
                <Text style={styles.emailBadgeText} numberOfLines={1}>
                  {unapprovedDetails.attemptedEmail}
                </Text>
              </View>

              <View style={styles.unapprovedInfoBox}>
                <Text style={styles.unapprovedInfoText}>
                  {unapprovedDetails.reason === "PENDING_APPROVAL"
                    ? "Our onboarding desk verifies GST/trade documents within 24–48 hours. You will receive notification as soon as your store is approved."
                    : unapprovedDetails.reason === "SUSPENDED" || unapprovedDetails.reason === "REJECTED"
                    ? "Please reach out to our partner operations desk for assistance or to submit clarification documents."
                    : "Only approved vendor partners can access the IntriHub Business portal. Apply now to sell your tile catalog to thousands of buyers."}
                </Text>
              </View>

              {/* Primary Action Button: Apply / Support */}
              {unapprovedDetails.reason === "NOT_FOUND" || unapprovedDetails.reason === "REJECTED" ? (
                <TouchableOpacity
                  style={styles.applyPartnerBtn}
                  onPress={() => router.push("/(auth)/apply-vendor" as any)}
                  activeOpacity={0.85}
                >
                  <UserPlus size={18} color="#FFFFFF" />
                  <Text style={styles.applyPartnerBtnText}>Apply as a Vendor Partner</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.supportPartnerBtn}
                  onPress={() => router.push("/(auth)/support" as any)}
                  activeOpacity={0.85}
                >
                  <Headphones size={18} color="#FFFFFF" />
                  <Text style={styles.supportPartnerBtnText}>Contact Partner Support</Text>
                </TouchableOpacity>
              )}

              {/* Secondary Button: Visit Website */}
              <TouchableOpacity
                style={styles.websiteBtn}
                onPress={() => Linking.openURL("https://intrihub.com")}
                activeOpacity={0.85}
              >
                <ExternalLink size={16} color="#052A51" />
                <Text style={styles.websiteBtnText}>Visit our Website (intrihub.com)</Text>
              </TouchableOpacity>

              {/* Change Email Button */}
              <TouchableOpacity
                style={styles.changeEmailBtn}
                onPress={() => {
                  setStep("input");
                  setError("");
                }}
                activeOpacity={0.8}
              >
                <ArrowLeft size={16} color={COLORS.accentOrange} />
                <Text style={styles.changeEmailBtnText}>Try a Different Email Address</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* BOTTOM ACTION SECTION: Apply as Vendor & Customer Executive Support */}
        <View style={styles.bottomNavSection}>
          {/* New Vendor Apply Card */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(auth)/apply-vendor" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "rgba(234, 88, 12, 0.12)" }]}>
              <UserPlus size={20} color={COLORS.accentOrange} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Want to Sell on Intrihub?</Text>
              <Text style={styles.actionDesc}>Apply as a Vendor Partner in 2 minutes</Text>
            </View>
            <ChevronRight size={18} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>

          {/* Customer Executive Desk Card */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(auth)/support" as any)}
            activeOpacity={0.85}
          >
            <View style={[styles.actionIconBox, { backgroundColor: "rgba(16, 185, 129, 0.14)" }]}>
              <Headphones size={20} color="#10B981" />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Partner & Executive Desk</Text>
              <Text style={styles.actionDesc}>Call +91 9264920211 / 24/7 Helpline</Text>
            </View>
            <ChevronRight size={18} color="rgba(255, 255, 255, 0.6)" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#052A51",
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: "center",
  },
  headerHero: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoBadgeBox: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    overflow: "hidden",
    ...SHADOWS.card,
  },
  brandIconImage: {
    width: 88,
    height: 88,
  },
  badgeContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(234, 88, 12, 0.35)",
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  brandSubtitle: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
  },
  formCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    ...SHADOWS.card,
  },
  lockoutBanner: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    alignItems: "center",
  },
  lockoutHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  lockoutTitle: {
    color: "#B91C1C",
    fontSize: 14,
    fontWeight: "800",
  },
  lockoutSubtitle: {
    color: "#7F1D1D",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
    marginBottom: 10,
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: "#F87171",
  },
  countdownText: {
    color: "#991B1B",
    fontSize: 13,
    fontWeight: "800",
  },
  errorBanner: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    height: 52,
    paddingHorizontal: 16,
    ...SHADOWS.card,
  },
  btnDisabled: {
    opacity: 0.5,
    backgroundColor: "#F1F5F9",
  },
  textDisabled: {
    color: "#94A3B8",
  },
  googleIconWrapper: {
    marginRight: 12,
  },
  googleBtnText: {
    color: "#1E293B",
    fontSize: 15,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E2E8F0",
  },
  dividerText: {
    marginHorizontal: 10,
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.textTertiary,
    letterSpacing: 0.5,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 6,
    marginTop: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 10,
  },
  inputWrapperDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
    opacity: 0.7,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.accentOrange,
    height: 52,
    borderRadius: 16,
    marginTop: 12,
    gap: 8,
    ...SHADOWS.button,
  },
  primaryBtnDisabled: {
    opacity: 0.5,
    backgroundColor: "#CBD5E1",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  accessNote: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16, 185, 129, 0.08)",
    padding: 12,
    borderRadius: 14,
    gap: 8,
    marginTop: 16,
  },
  accessNoteText: {
    flex: 1,
    fontSize: 12,
    color: "#065F46",
    lineHeight: 16,
    fontWeight: "500",
  },
  otpHeading: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
    textAlign: "center",
  },
  otpSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 20,
    lineHeight: 18,
  },
  resendRow: {
    alignItems: "center",
    marginTop: 14,
  },
  resendTextActive: {
    color: COLORS.accentOrange,
    fontSize: 13,
    fontWeight: "700",
  },
  resendTextInactive: {
    color: COLORS.textTertiary,
    fontSize: 13,
  },
  backToInputBtn: {
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 6,
  },
  backToInputText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  bottomNavSection: {
    width: "100%",
    marginTop: 20,
    gap: 10,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.09)",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  actionDesc: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    marginTop: 2,
  },
  unapprovedContainer: {
    alignItems: "center",
    paddingVertical: 8,
  },
  unapprovedIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  unapprovedTitle: {
    fontSize: 19,
    fontWeight: "900",
    color: "#052A51",
    textAlign: "center",
    marginBottom: 6,
  },
  unapprovedSubtitle: {
    fontSize: 13,
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 14,
    paddingHorizontal: 8,
  },
  emailBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    marginBottom: 14,
    maxWidth: "100%",
  },
  emailBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0F172A",
  },
  unapprovedInfoBox: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    width: "100%",
  },
  unapprovedInfoText: {
    fontSize: 12,
    color: "#64748B",
    lineHeight: 17,
    textAlign: "center",
  },
  applyPartnerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F26522",
    width: "100%",
    height: 48,
    borderRadius: 14,
    gap: 8,
    marginBottom: 10,
    ...SHADOWS.button,
  },
  applyPartnerBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  supportPartnerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#052A51",
    width: "100%",
    height: 48,
    borderRadius: 14,
    gap: 8,
    marginBottom: 10,
    ...SHADOWS.button,
  },
  supportPartnerBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  websiteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    width: "100%",
    height: 46,
    borderRadius: 14,
    gap: 8,
    marginBottom: 12,
  },
  websiteBtnText: {
    color: "#052A51",
    fontSize: 13,
    fontWeight: "700",
  },
  changeEmailBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  changeEmailBtnText: {
    color: COLORS.accentOrange,
    fontSize: 13,
    fontWeight: "800",
  },
});
