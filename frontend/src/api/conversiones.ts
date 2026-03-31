import api from './client';

export const conversionesApi = {
  getAll: (params?: any) => api.get('/conversiones', { params }),
  create: (data: any) => api.post('/conversiones', data),
};
