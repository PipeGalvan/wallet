export interface Factura {
  id: number;
  fecha: string;
  clienteId: number;
  importe: number;
  saldo: number;
  observacion: string;
  monedaId: number;
}

export interface FacturaGasto {
  id: number;
  fecha: string;
  observacion: string;
  fechaVencimiento: string;
  importe: number;
  saldo: number;
  monedaId: number;
  tipoEgresoId: number;
}
