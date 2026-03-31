export interface SaldoMoneda {
  monedaId: number;
  moneda: string;
  saldo: number;
}

export interface Caja {
  id: number;
  nombre: string;
  fecha: string;
  activo: boolean;
  totalizar: boolean;
  saldos?: SaldoMoneda[];
}

export interface Movimiento {
  id: number;
  tipo: 'ingreso' | 'egreso';
  fecha: string;
  fechaHora: string;
  concepto: string;
  observacion: string;
  importe: number;
  moneda: string;
  cliente?: string;
}
