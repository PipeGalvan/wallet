import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TipoEgreso } from './tipoegreso.entity';
import { CajaDiaria } from './cajadiaria.entity';
import { Moneda } from './moneda.entity';
import { Propietario } from './propietario.entity';
import { MovimientoRecurrente } from './movimientorecurrente.entity';

@Entity('egreso')
export class Egreso {
  @PrimaryGeneratedColumn({ name: 'EgresoId' })
  id: number;

  @Column({ name: 'EgresoFecha', type: 'date', nullable: true })
  fecha: Date;

  @Column({ name: 'EgresoFechaHora', type: 'datetime', nullable: true })
  fechaHora: Date;

  @Column({ name: 'EgresoObservacion', length: 60, nullable: true })
  observacion: string;

  @Column({ name: 'EgresoImporte', type: 'decimal', precision: 14, scale: 2, nullable: true })
  importe: number;

  @ManyToOne(() => TipoEgreso)
  @JoinColumn({ name: 'TipoEgresoId' })
  tipoEgreso: TipoEgreso;

  @ManyToOne(() => CajaDiaria)
  @JoinColumn({ name: 'CajaDiariaId' })
  cajaDiaria: CajaDiaria;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'MonedaId' })
  moneda: Moneda;

  @ManyToOne(() => Propietario, (p) => p.egresos)
  @JoinColumn({ name: 'EgresoPropietarioId' })
  propietario: Propietario;

  @ManyToOne(() => MovimientoRecurrente)
  @JoinColumn({ name: 'MovimientoRecurrenteId' })
  movimientoRecurrente: MovimientoRecurrente;
}
