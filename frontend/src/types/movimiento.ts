export interface TipoIngreso {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface TipoEgreso {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface Moneda {
  id: number;
  nombre: string;
}

export interface Ingreso {
  id: number;
  fecha: string;
  tipoIngresoId: number;
  tipoIngreso?: TipoIngreso;
  observacion: string;
  importe: number;
  fechaHora: string;
  clienteId?: number;
  monedaId: number;
  moneda?: Moneda;
}

export interface Egreso {
  id: number;
  fecha: string;
  tipoEgresoId: number;
  tipoEgreso?: TipoEgreso;
  observacion: string;
  importe: number;
  fechaHora: string;
  monedaId: number;
  moneda?: Moneda;
}

export interface CreateIngresoDto {
  fecha: string;
  tipoIngresoId: number;
  clienteId?: number;
  observacion?: string;
  monedaId: number;
  importe: number;
  cajaId: number;
}

export interface CreateEgresoDto {
  fecha: string;
  tipoEgresoId: number;
  observacion?: string;
  monedaId: number;
  importe: number;
  cajaId: number;
}

export interface CreateTransferenciaDto {
  fecha: string;
  cajaOrigenId: number;
  cajaDestinoId: number;
  monedaId: number;
  importe: number;
}
