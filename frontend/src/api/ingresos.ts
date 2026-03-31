import api from './client';

export const ingresosApi = {
  getAll: (params?: any) => api.get('/ingresos', { params }),
  getById: (id: number) => api.get(`/ingresos/${id}`),
  create: (data: any) => api.post('/ingresos', data),
  update: (id: number, data: any) => api.put(`/ingresos/${id}`, data),
  delete: (id: number) => api.delete(`/ingresos/${id}`),
};
