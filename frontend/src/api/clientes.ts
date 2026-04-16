import api from './client';

export const clientesApi = {
  getAll: (params?: any) => api.get('/clientes', { params }),
  getById: (id: number) => api.get(`/clientes/${id}`),
  create: (data: any) => api.post('/clientes', data),
  update: (id: number, data: any) => api.put(`/clientes/${id}`, data),
  delete: (id: number) => api.delete(`/clientes/${id}`),
};
