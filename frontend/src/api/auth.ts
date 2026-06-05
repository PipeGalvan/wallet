import api from './client';
import type { LoginRequest, RegisterRequest } from '../types/auth';

export const authApi = {
  login: (data: LoginRequest) => api.post('/auth/login', data),
  register: (data: RegisterRequest) => api.post('/auth/register', data),
  selectAccount: (propietarioId: number) => api.post('/auth/select-account', { propietarioId }),
  getProfile: () => api.get('/auth/me'),
};
