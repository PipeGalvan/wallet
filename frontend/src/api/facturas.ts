import api from './client';

export const facturasApi = {
  getAll: (params?: any) => api.get('/facturas', { params }),
  getPendientes: () => api.get('/facturas/pendientes'),
  getById: (id: number) => api.get(`/facturas/${id}`),
  create: (data: any) => api.post('/facturas', data),
  update: (id: number, data: any) => api.put(`/facturas/${id}`, data),
  cobrar: (id: number, data: any) => api.post(`/facturas/${id}/cobrar`, data),
};
