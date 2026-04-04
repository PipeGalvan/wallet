import api from './client';

export const catalogosApi = {
  getTiposIngreso: (params?: any) => api.get('/tipos-ingreso', { params }),
  createTipoIngreso: (data: any) => api.post('/tipos-ingreso', data),
  updateTipoIngreso: (id: number, data: any) => api.put(`/tipos-ingreso/${id}`, data),
  deleteTipoIngreso: (id: number) => api.delete(`/tipos-ingreso/${id}`),
  getTiposEgreso: (params?: any) => api.get('/tipos-egreso', { params }),
  createTipoEgreso: (data: any) => api.post('/tipos-egreso', data),
  updateTipoEgreso: (id: number, data: any) => api.put(`/tipos-egreso/${id}`, data),
  deleteTipoEgreso: (id: number) => api.delete(`/tipos-egreso/${id}`),
};
