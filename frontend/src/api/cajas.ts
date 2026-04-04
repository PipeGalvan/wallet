import api from './client';

export const cajasApi = {
  getAll: (params?: any) => api.get('/cajas', { params }),
  getById: (id: number) => api.get(`/cajas/${id}`),
  create: (data: any) => api.post('/cajas', data),
  update: (id: number, data: any) => api.put(`/cajas/${id}`, data),
  delete: (id: number) => api.delete(`/cajas/${id}`),
  getMovimientos: (id: number, page = 1, limit = 20) =>
    api.get(`/cajas/${id}/movimientos`, { params: { page, limit } }),
};
