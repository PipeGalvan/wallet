import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { TipoIngreso } from './tipoingreso.entity';
import { Cliente } from './cliente.entity';
import { CajaDiaria } from './cajadiaria.entity';
import { Moneda } from './moneda.entity';
import { Propietario } from './propietario.entity';
import { MovimientoRecurrente } from './movimientorecurrente.entity';

@Entity('ingreso')
export class Ingreso {
  @PrimaryGeneratedColumn({ name: 'IngresoId' })
  id: number;

  @Column({ name: 'IngresoFecha', type: 'date', nullable: true })
  fecha: Date;

  @Column({ name: 'TipoIngresoId', nullable: true })
  tipoIngresoId: number;

  @Column({ name: 'IngresoObservacion', length: 60, nullable: true })
  observacion: string;

  @Column({ name: 'IngresoImporte', type: 'decimal', precision: 14, scale: 2, nullable: true })
  importe: number;

  @Column({ name: 'IngresoFechaHora', type: 'datetime', nullable: true })
  fechaHora: Date;

  @Column({ name: 'ClienteId', nullable: true })
  clienteId: number;

  @Column({ name: 'CajaDiariaId', nullable: true })
  cajaDiariaId: number;

  @Column({ name: 'MonedaId', nullable: true })
  monedaId: number;

  @Column({ name: 'IngresoPropietarioId', nullable: true })
  propietarioId: number;

  @ManyToOne(() => TipoIngreso)
  @JoinColumn({ name: 'TipoIngresoId' })
  tipoIngreso: TipoIngreso;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'ClienteId' })
  cliente: Cliente;

  @ManyToOne(() => CajaDiaria)
  @JoinColumn({ name: 'CajaDiariaId' })
  cajaDiaria: CajaDiaria;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'MonedaId' })
  moneda: Moneda;

  @ManyToOne(() => Propietario, (p) => p.ingresos)
  @JoinColumn({ name: 'IngresoPropietarioId' })
  propietario: Propietario;

  @Column({ name: 'MovimientoRecurrenteId', nullable: true })
  movimientoRecurrenteId: number;

  @ManyToOne(() => MovimientoRecurrente)
  @JoinColumn({ name: 'MovimientoRecurrenteId' })
  movimientoRecurrente: MovimientoRecurrente;
}
