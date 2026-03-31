import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PlanillaCobros } from './planillacobros.entity';
import { TipoIngreso } from './tipoingreso.entity';
import { Moneda } from './moneda.entity';
import { Cliente } from './cliente.entity';

@Entity('planillacobrosdetalle')
export class PlanillaCobrosDetalle {
  @PrimaryColumn({ name: 'PlanillaCobrosId' })
  planillaId: number;

  @PrimaryColumn({ name: 'PlanillaCobrosDetalleId' })
  detalleId: number;

  @Column({ name: 'PlanillaCobrosDetalleTipoIngresoId', nullable: true })
  tipoIngresoId: number;

  @Column({ name: 'PlanillaCobrosDetalleMonedaId', nullable: true })
  monedaId: number;

  @Column({ name: 'PlanillaCobrosDetalleImporte', type: 'decimal', precision: 14, scale: 2, nullable: true })
  importe: number;

  @Column({ name: 'PlanillaCobrosDetalleSaldo', type: 'decimal', precision: 14, scale: 2, nullable: true })
  saldo: number;

  @Column({ name: 'PlanillaCobrosDetalleFechaVenc', type: 'date', nullable: true })
  fechaVencimiento: Date;

  @Column({ name: 'PlanillaCobrosDetallePagado', nullable: true })
  pagado: boolean;

  @Column({ name: 'PlanillaCobrosDetalleClienteId', nullable: true })
  clienteId: number;

  @ManyToOne(() => PlanillaCobros, (p) => p.detalles)
  @JoinColumn({ name: 'PlanillaCobrosId' })
  planilla: PlanillaCobros;

  @ManyToOne(() => TipoIngreso)
  @JoinColumn({ name: 'PlanillaCobrosDetalleTipoIngresoId' })
  tipoIngreso: TipoIngreso;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'PlanillaCobrosDetalleMonedaId' })
  moneda: Moneda;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'PlanillaCobrosDetalleClienteId' })
  cliente: Cliente;
}
