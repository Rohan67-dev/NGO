import axios, { AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export const TOKEN_KEY = 'ngo_auth_token';
export const USER_KEY = 'ngo_auth_user';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/** Called when the server says the stored token is no longer valid. Registered by the auth store. */
let onUnauthorized: (() => void) | null = null;
export const setUnauthorizedHandler = (handler: () => void) => {
  onUnauthorized = handler;
};

axiosClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url || '';
    const isAuthAttempt = url.includes('/auth/login') || url.includes('/auth/register');
    if (error.response?.status === 401 && !isAuthAttempt && localStorage.getItem(TOKEN_KEY)) {
      // Expired or revoked session: clear it so the UI stops pretending the user is signed in.
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

/** Extracts a human-readable message from an API error (validation details included). */
export const getErrorMessage = (error: unknown, fallback = 'Something went wrong. Please try again.'): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Cannot reach the server. Please check your connection and that the backend is running.';
    }
    const data = error.response.data as { message?: string; errors?: string[] } | undefined;
    if (data?.errors && data.errors.length > 0) {
      return `${data.message || 'Validation failed'}: ${data.errors.join('; ')}`;
    }
    if (data?.message) return data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
};

/** True when the error is "you need to sign in". */
export const isAuthError = (error: unknown): boolean =>
  axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403);
