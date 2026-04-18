import api from './client';
import {
  CreateMovimientoRecurrente,
  UpdateMovimientoRecurrente,
  ConfirmMovimientoRecurrente,
  ConfirmLoteRequest,
} from '../types/movimientoRecurrente';

export const movimientosRecurrentesApi = {
  getAll: (params?: { page?: number; limit?: number; tipo?: string; activo?: boolean }) =>
    api.get('/movimientos-recurrentes', { params }),

  getById: (id: number) =>
    api.get(`/movimientos-recurrentes/${id}`),

  create: (data: CreateMovimientoRecurrente) =>
    api.post('/movimientos-recurrentes', data),

  update: (id: number, data: UpdateMovimientoRecurrente) =>
    api.put(`/movimientos-recurrentes/${id}`, data),

  delete: (id: number) =>
    api.delete(`/movimientos-recurrentes/${id}`),

  getPendientes: () =>
    api.get('/movimientos-recurrentes/pendientes'),

  confirmar: (id: number, data: ConfirmMovimientoRecurrente) =>
    api.post(`/movimientos-recurrentes/${id}/confirmar`, data),

  confirmarLote: (data: ConfirmLoteRequest) =>
    api.post('/movimientos-recurrentes/confirmar-lote', data),

  pausar: (id: number) =>
    api.put(`/movimientos-recurrentes/${id}/pausar`),

  reanudar: (id: number) =>
    api.put(`/movimientos-recurrentes/${id}/reanudar`),
};
