import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const { token } = useAuthStore.getState();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } else if (error.response?.status >= 500) {
      // Server errors: always show global toast (these are unexpected)
      const msg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Error del servidor. Intentá de nuevo más tarde.';
      toast.error(msg, { id: `err-${status}-${msg.substring(0, 30)}` });
    }
    // 400-level errors (validation, not found, etc.) are handled by pages
    // Don't show global toast to avoid double toasts
    return Promise.reject(error);
  },
);

export default api;
