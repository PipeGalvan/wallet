import api from './client';
import type { LoginRequest } from '../types/auth';

export const authApi = {
  login: (data: LoginRequest) => api.post('/auth/login', data),
  selectAccount: (propietarioId: number) => api.post('/auth/select-account', { propietarioId }),
  getProfile: () => api.get('/auth/me'),
};
