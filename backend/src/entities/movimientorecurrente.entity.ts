import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Propietario } from './propietario.entity';
import { Caja } from './caja.entity';
import { Moneda } from './moneda.entity';
import { Cliente } from './cliente.entity';

@Entity('movimientorecurrente')
export class MovimientoRecurrente {
  @PrimaryGeneratedColumn({ name: 'MovimientoRecurrenteId' })
  id: number;

  @Column({ name: 'MovimientoRecurrenteTipo', length: 20 })
  tipo: string;

  @Column({ name: 'TipoMovimientoId' })
  tipoMovimientoId: number;

  @Column({ name: 'ClienteId', nullable: true })
  clienteId: number;

  @Column({ name: 'CajaId' })
  cajaId: number;

  @Column({ name: 'MonedaId' })
  monedaId: number;

  @Column({ name: 'MovimientoRecurrenteMontoEstimado', type: 'decimal', precision: 14, scale: 2 })
  montoEstimado: number;

  @Column({ name: 'MovimientoRecurrenteObservacion', length: 60, nullable: true })
  observacion: string;

  @Column({ name: 'MovimientoRecurrenteFrecuencia', length: 20, default: 'mensual' })
  frecuencia: string;

  @Column({ name: 'MovimientoRecurrenteDiaDelMes' })
  diaDelMes: number;

  @Column({ name: 'MovimientoRecurrenteOcurrenciasTotales', nullable: true })
  ocurrenciasTotales: number;

  @Column({ name: 'MovimientoRecurrenteOcurrenciasConfirmadas', default: 0 })
  ocurrenciasConfirmadas: number;

  @Column({ name: 'MovimientoRecurrenteActivo', default: true })
  activo: boolean;

  @Column({ name: 'MovimientoRecurrentePausado', default: false })
  pausado: boolean;

  @Column({ name: 'MovimientoRecurrentePropietarioId' })
  propietarioId: number;

  @Column({ name: 'MovimientoRecurrenteFechaInicio', type: 'date' })
  fechaInicio: Date;

  @Column({ name: 'MovimientoRecurrenteFechaProxima', type: 'date', nullable: true })
  fechaProxima: Date;

  @Column({ name: 'MovimientoRecurrenteCreatedAt', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ name: 'MovimientoRecurrenteUpdatedAt', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Propietario, (p) => p.movimientosRecurrentes)
  @JoinColumn({ name: 'MovimientoRecurrentePropietarioId' })
  propietario: Propietario;

  @ManyToOne(() => Caja)
  @JoinColumn({ name: 'CajaId' })
  caja: Caja;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'MonedaId' })
  moneda: Moneda;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'ClienteId' })
  cliente: Cliente;
}
