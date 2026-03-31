import api from './client';

export const reportesApi = {
  getResumen: (params?: any) => api.get('/reportes/resumen', { params }),
  getMovimientos: (params?: any) => api.get('/reportes/movimientos', { params }),
  getSaldos: () => api.get('/reportes/saldos'),
  getFacturasPendientes: () => api.get('/reportes/facturas-pendientes'),
};
