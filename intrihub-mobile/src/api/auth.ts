import { apiClient, setStoredTokens, clearStoredTokens } from "./client";
import { User } from "../types";

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  user?: User;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export async function sendOtp(emailOrPhone: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const isEmail = emailOrPhone.includes("@");
  const payload = isEmail ? { email: emailOrPhone } : { phone: emailOrPhone };
  const res = await apiClient.post("/api/mobile/auth/send-otp", payload);
  return res.data;
}

export async function verifyOtp(params: {
  emailOrPhone: string;
  otp: string;
  name?: string;
}): Promise<AuthResponse> {
  const isEmail = params.emailOrPhone.includes("@");
  const payload = {
    otp: params.otp,
    name: params.name,
    ...(isEmail ? { email: params.emailOrPhone } : { phone: params.emailOrPhone }),
  };
  const res = await apiClient.post<AuthResponse>("/api/mobile/auth/verify-otp", payload);
  if (res.data.success && res.data.tokens) {
    await setStoredTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
  }
  return res.data;
}

export async function loginWithPhoneOrEmail(identifier: string, name?: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/api/mobile/auth/login", { identifier, name });
  if (res.data.success && res.data.tokens) {
    await setStoredTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
  }
  return res.data;
}

export async function getProfile(): Promise<{ success: boolean; user?: User; error?: string }> {
  const res = await apiClient.get("/api/mobile/auth/me");
  return res.data;
}

export async function updateProfile(data: { name?: string; email?: string; avatar?: string }): Promise<{ success: boolean; user?: User; error?: string }> {
  const res = await apiClient.patch("/api/mobile/auth/me", data);
  return res.data;
}

export async function loginWithGoogle(params: {
  idToken?: string;
  accessToken?: string;
  profile?: { email?: string; name?: string; avatar?: string };
}): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/api/mobile/auth/google", params);
  if (res.data.success && res.data.tokens) {
    await setStoredTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
  }
  return res.data;
}

export async function logout(): Promise<void> {
  await clearStoredTokens();
}
