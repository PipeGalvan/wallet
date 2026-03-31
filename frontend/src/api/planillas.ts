import api from './client';

export const planillasGastoApi = {
  getAll: () => api.get('/planillas-gastos'),
  getById: (id: number) => api.get(`/planillas-gastos/${id}`),
  create: (data: any) => api.post('/planillas-gastos', data),
  addItem: (id: number, data: any) => api.post(`/planillas-gastos/${id}/items`, data),
  pagarItem: (planillaId: number, detalleId: number, data: any) =>
    api.post(`/planillas-gastos/${planillaId}/items/${detalleId}/pagar`, data),
};

export const planillasCobroApi = {
  getAll: () => api.get('/planillas-cobros'),
  getById: (id: number) => api.get(`/planillas-cobros/${id}`),
  create: (data: any) => api.post('/planillas-cobros', data),
  addItem: (id: number, data: any) => api.post(`/planillas-cobros/${id}/items`, data),
  cobrarItem: (planillaId: number, detalleId: number, data: any) =>
    api.post(`/planillas-cobros/${planillaId}/items/${detalleId}/cobrar`, data),
};
