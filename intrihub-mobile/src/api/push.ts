import { apiClient } from "./client";

export async function registerPushToken(token: string, platform = "android"): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiClient.post("/api/mobile/push-token", {
      token,
      platform,
      appType: "user",
    });
    return res.data;
  } catch (err: any) {
    console.warn("Failed to register push token with server:", err.message);
    return { success: false, error: err.message };
  }
}

export async function unregisterPushToken(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiClient.delete("/api/mobile/push-token", {
      data: { token },
    });
    return res.data;
  } catch (err: any) {
    console.warn("Failed to unregister push token with server:", err.message);
    return { success: false, error: err.message };
  }
}

