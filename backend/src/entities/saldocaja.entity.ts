import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Caja } from './caja.entity';
import { Moneda } from './moneda.entity';

@Entity('saldocaja')
@Unique(['cajaId', 'monedaId'])
export class SaldoCaja {
  @PrimaryGeneratedColumn({ name: 'SaldoCajaId' })
  id: number;

  @Column({ name: 'CajaId' })
  cajaId: number;

  @Column({ name: 'MonedaId' })
  monedaId: number;

  @Column({ name: 'Saldo', type: 'decimal', precision: 18, scale: 2, default: 0 })
  saldo: number;

  @Column({ name: 'FechaActualizacion', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fechaActualizacion: Date;

  @ManyToOne(() => Caja)
  @JoinColumn({ name: 'CajaId' })
  caja: Caja;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'MonedaId' })
  moneda: Moneda;
}
