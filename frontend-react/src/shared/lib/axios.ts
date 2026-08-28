import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Module-level token holder — kept here (not in the Zustand store) so
// `shared/lib` never has to import from `features/auth` (features depend on
// shared, never the other way around; see FE-ARCHITECTURE.md).
let accessToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/** Registered once by the auth feature; called when a silent refresh fails. */
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  onUnauthorized = handler;
}

let refreshPromise: Promise<string> | null = null;

declare module 'axios' {
  export interface AxiosRequestConfig {
    _retry?: boolean;
    _skipAuthHandling?: boolean;
  }
}

const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1',
    withCredentials: true, // send the httpOnly refreshToken cookie
  });

  instance.interceptors.request.use((config) => {
    if (accessToken && !config.headers?.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response.data,
    async (error) => {
      const config = error.config as AxiosRequestConfig | undefined;

      if (error.response?.status === 401 && config && !config._retry && !config._skipAuthHandling) {
        config._retry = true;

        refreshPromise ??= instance
          .post<{ accessToken: string }>('/auth/refresh', {}, { _skipAuthHandling: true })
          .then((data: unknown) => {
            const token = (data as { accessToken: string }).accessToken;
            setAccessToken(token);
            return token;
          })
          .finally(() => {
            refreshPromise = null;
          });

        try {
          const token = await refreshPromise;
          config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
          return instance(config);
        } catch {
          setAccessToken(null);
          onUnauthorized?.();
          return Promise.reject(normalizeError(error));
        }
      }

      return Promise.reject(normalizeError(error));
    },
  );

  return instance;
};

function normalizeError(error: unknown): ApiError {
  const axiosError = error as { response?: { data?: { error?: Partial<ApiError> } } };
  return {
    code: axiosError.response?.data?.error?.code || 'SYS_001',
    message: axiosError.response?.data?.error?.message || 'An error occurred',
    details: axiosError.response?.data?.error?.details || {},
  };
}

export const axiosInstance = createAxiosInstance();

/**
 * Typed wrapper — the response interceptor above already unwraps
 * `AxiosResponse` down to its `.data` (the `{ success, data, meta? }`
 * envelope), so these methods resolve directly to `T`.
 */
export const api = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.get(url, config) as unknown as Promise<T>,
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.post(url, data, config) as unknown as Promise<T>,
  patch: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.patch(url, data, config) as unknown as Promise<T>,
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.put(url, data, config) as unknown as Promise<T>,
  delete: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.delete(url, config) as unknown as Promise<T>,
};
