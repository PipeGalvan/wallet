import api from './client';

export const egresosApi = {
  getAll: (params?: any) => api.get('/egresos', { params }),
  getById: (id: number) => api.get(`/egresos/${id}`),
  create: (data: any) => api.post('/egresos', data),
  update: (id: number, data: any) => api.put(`/egresos/${id}`, data),
  delete: (id: number) => api.delete(`/egresos/${id}`),
};
