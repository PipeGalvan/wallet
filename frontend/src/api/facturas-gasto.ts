import api from './client';

export const facturasGastoApi = {
  getAll: (params?: any) => api.get('/facturas-gasto', { params }),
  getById: (id: number) => api.get(`/facturas-gasto/${id}`),
  create: (data: any) => api.post('/facturas-gasto', data),
  update: (id: number, data: any) => api.put(`/facturas-gasto/${id}`, data),
  pagar: (id: number, data: any) => api.post(`/facturas-gasto/${id}/pagar`, data),
};
