import api from './client';

export const transferenciasApi = {
  getAll: (params?: any) => api.get('/transferencias', { params }),
  getById: (id: number) => api.get(`/transferencias/${id}`),
  create: (data: any) => api.post('/transferencias', data),
};
