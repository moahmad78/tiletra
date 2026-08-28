import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "https://www.intrihub.com";

const ACCESS_TOKEN_KEY = "intrihub_biz_access_token";
const REFRESH_TOKEN_KEY = "intrihub_biz_refresh_token";

export async function getStoredAccessToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined"
        ? localStorage.getItem(ACCESS_TOKEN_KEY)
        : null;
    }
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getStoredRefreshToken(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof localStorage !== "undefined"
        ? localStorage.getItem(REFRESH_TOKEN_KEY)
        : null;
    }
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredTokens(accessToken: string, refreshToken: string): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      return;
    }
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } catch (err) {
    console.warn("Error storing auth tokens:", err);
  }
}

export async function clearStoredTokens(): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        localStorage.removeItem(REFRESH_TOKEN_KEY);
      }
      return;
    }
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (err) {
    console.warn("Error clearing tokens:", err);
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  timeout: 20000,
});

apiClient.interceptors.request.use(
  async (config) => {
    const token = await getStoredAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await getStoredRefreshToken();
        if (refreshToken) {
          const res = await axios.post(`${API_BASE_URL}/api/mobile/auth/refresh`, {
            refreshToken,
          });
          if (res.data.success && res.data.tokens) {
            await setStoredTokens(
              res.data.tokens.accessToken,
              res.data.tokens.refreshToken
            );
            originalRequest.headers.Authorization = `Bearer ${res.data.tokens.accessToken}`;
            return apiClient(originalRequest);
          }
        }
      } catch (refreshErr) {
        await clearStoredTokens();
      }
    }
    return Promise.reject(error);
  }
);
