import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PlanillaGastos } from './planillagastos.entity';
import { TipoEgreso } from './tipoegreso.entity';
import { Moneda } from './moneda.entity';

@Entity('planillagastosdetalle')
export class PlanillaGastosDetalle {
  @PrimaryColumn({ name: 'PlanillaGastosId' })
  planillaId: number;

  @PrimaryColumn({ name: 'PlanillaGastosDetalleId' })
  detalleId: number;

  @Column({ name: 'PlanillaGastosDetalleTipoEgresoId', nullable: true })
  tipoEgresoId: number;

  @Column({ name: 'PlanillaGastosDetalleImporte', type: 'decimal', precision: 14, scale: 2, nullable: true })
  importe: number;

  @Column({ name: 'PlanillaGastosDetallePagado', nullable: true })
  pagado: boolean;

  @Column({ name: 'PlanillaGastosDetalleFechaVenc', type: 'date', nullable: true })
  fechaVencimiento: Date;

  @Column({ name: 'PlanillaGastosDetalleMonedaId', nullable: true })
  monedaId: number;

  @Column({ name: 'PlanillaGastosDetalleSaldo', type: 'decimal', precision: 14, scale: 2, nullable: true })
  saldo: number;

  @ManyToOne(() => PlanillaGastos, (p) => p.detalles)
  @JoinColumn({ name: 'PlanillaGastosId' })
  planilla: PlanillaGastos;

  @ManyToOne(() => TipoEgreso)
  @JoinColumn({ name: 'PlanillaGastosDetalleTipoEgresoId' })
  tipoEgreso: TipoEgreso;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'PlanillaGastosDetalleMonedaId' })
  moneda: Moneda;
}
