import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Caja } from './caja.entity';
import { Moneda } from './moneda.entity';
import { Propietario } from './propietario.entity';

@Entity('conversionmoneda')
export class ConversionMoneda {
  @PrimaryGeneratedColumn({ name: 'ConversionId' })
  id: number;

  @Column({ name: 'CajaId' })
  cajaId: number;

  @Column({ name: 'MonedaOrigenId' })
  monedaOrigenId: number;

  @Column({ name: 'MonedaDestinoId' })
  monedaDestinoId: number;

  @Column({ name: 'TipoCambio', type: 'decimal', precision: 18, scale: 6 })
  tipoCambio: number;

  @Column({ name: 'ImporteOrigen', type: 'decimal', precision: 18, scale: 2 })
  importeOrigen: number;

  @Column({ name: 'ImporteDestino', type: 'decimal', precision: 18, scale: 2 })
  importeDestino: number;

  @Column({ name: 'PropietarioId' })
  propietarioId: number;

  @CreateDateColumn({ name: 'Fecha' })
  fecha: Date;

  @ManyToOne(() => Caja)
  @JoinColumn({ name: 'CajaId' })
  caja: Caja;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'MonedaOrigenId' })
  monedaOrigen: Moneda;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'MonedaDestinoId' })
  monedaDestino: Moneda;

  @ManyToOne(() => Propietario)
  @JoinColumn({ name: 'PropietarioId' })
  propietario: Propietario;
}
