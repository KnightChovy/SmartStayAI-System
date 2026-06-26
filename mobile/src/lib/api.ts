import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useAuthStore } from '@/stores/authStore';

/**
 * Axios instance dùng chung cho toàn app.
 *
 * - baseURL lấy từ `EXPO_PUBLIC_API_BASE_URL` (mặc định trỏ backend dev `/v1`).
 *   ⚠️ Trên thiết bị thật, `localhost` là chính máy đó → đổi sang IP LAN của máy
 *   chạy server (vd `http://192.168.x.x:5000/v1`) trong `.env`.
 * - Request interceptor: tự gắn `Authorization: Bearer <accessToken>`.
 * - Response interceptor: 401/403 → thử refresh token một lần rồi retry; thất bại
 *   thì clear session (đẩy user về màn đăng nhập ở tầng UI).
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:5000/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Cho phép đánh dấu request đã retry để tránh lặp vô hạn.
type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function flushQueue(error: unknown, token: string | null) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(error);
  });
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (RetriableConfig & InternalAxiosRequestConfig) | undefined;
    const status = error.response?.status;

    if (!originalRequest || (status !== 401 && status !== 403) || originalRequest._retry) {
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    // Đang refresh ở request khác → xếp hàng chờ token mới rồi retry.
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      });
    }

    const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();
    if (!refreshToken) {
      clearAuth();
      return Promise.reject(error);
    }

    isRefreshing = true;
    try {
      // Dùng axios "trần" để không bị interceptor này bắt lại.
      const { data } = await axios.post<{
        access: { token: string };
        refresh: { token: string };
      }>(`${API_BASE_URL}/auth/refresh-tokens`, { refreshToken });

      const newAccess = data.access?.token;
      const newRefresh = data.refresh?.token;
      if (!newAccess || !newRefresh) {
        throw new Error('Invalid refresh response');
      }

      setTokens(newAccess, newRefresh);
      flushQueue(null, newAccess);
      originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      return api(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      clearAuth();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);
