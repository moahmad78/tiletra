import { apiClient, setStoredTokens, clearStoredTokens } from "./client";
import { User } from "../types";

export interface AuthResponse {
  success: boolean;
  message?: string;
  error?: string;
  locked?: boolean;
  lockoutUntil?: number;
  retryAfterSeconds?: number;
  remainingAttempts?: number;
  vendorStatus?: string;
  user?: User;
  tokens?: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export async function sendOtp(emailOrPhone: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  locked?: boolean;
  lockoutUntil?: number;
  retryAfterSeconds?: number;
}> {
  const isEmail = emailOrPhone.includes("@");
  const payload = {
    purpose: "business",
    ...(isEmail ? { email: emailOrPhone } : { phone: emailOrPhone }),
  };
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
    purpose: "business",
    ...(isEmail ? { email: params.emailOrPhone } : { phone: params.emailOrPhone }),
  };
  const res = await apiClient.post<AuthResponse>("/api/mobile/auth/verify-otp", payload);
  if (res.data.success && res.data.tokens) {
    await setStoredTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
  }
  return res.data;
}

export async function loginWithPhoneOrEmail(identifier: string, name?: string): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/api/mobile/auth/login", {
    identifier,
    name,
    purpose: "business",
  });
  if (res.data.success && res.data.tokens) {
    await setStoredTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
  }
  return res.data;
}

export async function getProfile(): Promise<{ success: boolean; user?: User; error?: string }> {
  const res = await apiClient.get("/api/mobile/auth/me");
  return res.data;
}

export async function updateProfile(data: {
  name?: string;
  email?: string;
  avatar?: string;
  phone?: string;
}): Promise<{ success: boolean; user?: User; error?: string }> {
  const res = await apiClient.patch("/api/mobile/auth/me", data);
  return res.data;
}

export async function loginWithGoogle(params: {
  idToken?: string;
  accessToken?: string;
  profile?: { email?: string; name?: string; avatar?: string };
}): Promise<AuthResponse> {
  const res = await apiClient.post<AuthResponse>("/api/mobile/auth/google", {
    ...params,
    purpose: "business",
  });
  if (res.data.success && res.data.tokens) {
    await setStoredTokens(res.data.tokens.accessToken, res.data.tokens.refreshToken);
  }
  return res.data;
}

export async function logout(): Promise<void> {
  await clearStoredTokens();
}

export async function uploadBusinessImage(
  uri: string,
  fileName?: string,
  mimeType?: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const formData = new FormData();
    const cleanName = fileName || `image-${Date.now()}.jpg`;
    const cleanType = mimeType || "image/jpeg";

    formData.append("file", {
      uri,
      name: cleanName,
      type: cleanType,
    } as any);

    const baseURL = apiClient.defaults.baseURL || "https://www.intrihub.com";
    const res = await fetch(`${baseURL}/api/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    const data = await res.json();
    if (res.ok && data.success) {
      const fullUrl = data.url.startsWith("http") ? data.url : `${baseURL}${data.url}`;
      return { success: true, url: fullUrl };
    }
    return { success: false, error: data.error || "Upload failed" };
  } catch (err: any) {
    console.error("uploadBusinessImage error:", err);
    return { success: false, error: err.message || "Failed to upload image" };
  }
}

export async function updateUserProfile(data: {
  name?: string;
  phone?: string;
}): Promise<{ success: boolean; user?: any; error?: string }> {
  const res = await apiClient.patch("/api/mobile/auth/me", data);
  return res.data;
}
