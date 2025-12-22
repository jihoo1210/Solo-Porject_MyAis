import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// 토큰 갱신 중인지 추적
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor - Add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle success and errors
apiClient.interceptors.response.use(
  (response) => {
    // Unwrap ApiResponse wrapper - backend returns { success, data, message }
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // USER_NOT_FOUND: 토큰은 유효하지만 DB에 사용자가 없음 (서버 재시작 등)
      const errorCode = error.response?.data?.error?.code;
      if (errorCode === 'USER_NOT_FOUND' || errorCode === 'TOKEN_EXPIRED') {
        const { clearAuth } = useAuthStore.getState();
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      // refresh 요청 자체가 401이면 로그아웃
      if (originalRequest.url?.includes('/auth/refresh')) {
        const { clearAuth } = useAuthStore.getState();
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // 이미 갱신 중이면 대기열에 추가
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const { refreshToken, setTokens, clearAuth } = useAuthStore.getState();

      if (!refreshToken) {
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // refresh token으로 새 access token 발급
        const response = await axios.post(`${API_BASE_URL}/v1/auth/refresh`, {
          refreshToken,
        });

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = response.data.data || response.data;

        setTokens(newAccessToken, newRefreshToken);

        // 대기 중인 요청들 처리
        processQueue(null, newAccessToken);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Helper for multipart form data
export const uploadClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  timeout: 60000,
});

uploadClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for uploadClient - Unwrap ApiResponse wrapper
uploadClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === 'object' && 'success' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => Promise.reject(error)
);
