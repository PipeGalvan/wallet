import api from './client';

export const catalogosApi = {
  getTiposIngreso: () => api.get('/tipos-ingreso'),
  createTipoIngreso: (data: any) => api.post('/tipos-ingreso', data),
  updateTipoIngreso: (id: number, data: any) => api.put(`/tipos-ingreso/${id}`, data),
  deleteTipoIngreso: (id: number) => api.delete(`/tipos-ingreso/${id}`),
  getTiposEgreso: () => api.get('/tipos-egreso'),
  createTipoEgreso: (data: any) => api.post('/tipos-egreso', data),
  updateTipoEgreso: (id: number, data: any) => api.put(`/tipos-egreso/${id}`, data),
  deleteTipoEgreso: (id: number) => api.delete(`/tipos-egreso/${id}`),
};
