import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TipoEgreso } from './tipoegreso.entity';
import { Propietario } from './propietario.entity';
import { Moneda } from './moneda.entity';

@Entity('facturagasto')
export class FacturaGasto {
  @PrimaryGeneratedColumn({ name: 'FacturaGastoId' })
  id: number;

  @Column({ name: 'FacturaGastoFecha', type: 'date', nullable: true })
  fecha: Date;

  @Column({ name: 'FacturaGastoObservacion', length: 60, nullable: true })
  observacion: string;

  @Column({ name: 'FacturaGastoFechaVencimiento', type: 'date', nullable: true })
  fechaVencimiento: Date;

  @Column({ name: 'FacturaGastoImporte', type: 'decimal', precision: 14, scale: 2, nullable: true })
  importe: number;

  @Column({ name: 'FacturaGastoSaldo', type: 'decimal', precision: 14, scale: 2, nullable: true })
  saldo: number;

  @Column({ name: 'MonedaId', nullable: true })
  monedaId: number;

  @Column({ name: 'TipoEgresoId', nullable: true })
  tipoEgresoId: number;

  @Column({ name: 'FacturaGastoPropietarioId', nullable: true })
  propietarioId: number;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'MonedaId' })
  moneda: Moneda;

  @ManyToOne(() => TipoEgreso)
  @JoinColumn({ name: 'TipoEgresoId' })
  tipoEgreso: TipoEgreso;

  @ManyToOne(() => Propietario, (p) => p.facturasGasto)
  @JoinColumn({ name: 'FacturaGastoPropietarioId' })
  propietario: Propietario;
}
