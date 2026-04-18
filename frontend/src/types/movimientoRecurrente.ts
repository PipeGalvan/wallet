export interface MovimientoRecurrente {
  id: number;
  tipo: 'INGRESO' | 'EGRESO';
  tipoMovimientoId: number;
  clienteId?: number;
  monedaId: number;
  montoEstimado: number;
  cajaId: number;
  observacion?: string;
  frecuencia: string;
  diaDelMes: number;
  fechaInicio: string;
  ocurrenciasTotales?: number;
  ocurrenciasConfirmadas: number;
  activo: boolean;
  pausado: boolean;
  propietarioId: number;
  fechaProxima?: string;
  createdAt: string;
  updatedAt: string;
  // Relations (when loaded via joins)
  caja?: { id: number; nombre: string };
  moneda?: { id: number; nombre: string };
  cliente?: { id: number; nombre: string };
}

export interface CreateMovimientoRecurrente {
  tipo: 'INGRESO' | 'EGRESO';
  tipoMovimientoId: number;
  clienteId?: number;
  monedaId: number;
  montoEstimado: number;
  cajaId: number;
  observacion?: string;
  frecuencia?: string;
  diaDelMes: number;
  fechaInicio: string;
  fechaFin?: string;
  cantidadOcurrencias?: number;
}

export interface UpdateMovimientoRecurrente extends Partial<CreateMovimientoRecurrente> {}

export interface ConfirmMovimientoRecurrente {
  importe: number;
  observacion?: string;
  fecha?: string;
}

export interface PendienteItem extends MovimientoRecurrente {
  montoSugerido: number;
}

export interface ConfirmLoteRequest {
  items: Array<{
    id: number;
    importe: number;
    observacion?: string;
    fecha?: string;
  }>;
}
