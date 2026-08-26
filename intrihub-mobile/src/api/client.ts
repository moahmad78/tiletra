import axios, { AxiosRequestConfig } from "axios";
import * as SecureStore from "expo-secure-store";
import { API_BASE_URL } from "../constants/config";

const ACCESS_TOKEN_KEY = "intrihub_access_token";
const REFRESH_TOKEN_KEY = "intrihub_refresh_token";

export async function getStoredAccessToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function getStoredRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setStoredTokens(accessToken: string, refreshToken: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  } catch (err) {
    console.warn("Error storing tokens in SecureStore:", err);
  }
}

export async function clearStoredTokens(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  } catch (err) {
    console.warn("Error clearing tokens from SecureStore:", err);
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 25000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Request Interceptor: Attach Bearer token
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getStoredAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
  config: AxiosRequestConfig;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token && prom.config.headers) {
      prom.config.headers.Authorization = `Bearer ${token}`;
      apiClient(prom.config).then(prom.resolve).catch(prom.reject);
    }
  });
  failedQueue = [];
};

// Response Interceptor: Handle 401 Token Refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, config: originalRequest });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getStoredRefreshToken();
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const res = await axios.post(`${API_BASE_URL}/api/mobile/auth/refresh`, {
          refreshToken,
        });

        if (res.data?.success && res.data?.tokens) {
          const { accessToken, refreshToken: newRefresh } = res.data.tokens;
          await setStoredTokens(accessToken, newRefresh || refreshToken);

          processQueue(null, accessToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }
          return apiClient(originalRequest);
        } else {
          throw new Error("Failed to refresh token");
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await clearStoredTokens();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
