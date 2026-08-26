import { apiClient } from "./client";

export async function registerPushToken(token: string, platform = "android"): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiClient.post("/api/mobile/push/register-token", {
      token,
      platform,
    });
    return res.data;
  } catch (err: any) {
    console.warn("Failed to register push token with server:", err.message);
    return { success: false, error: err.message };
  }
}
