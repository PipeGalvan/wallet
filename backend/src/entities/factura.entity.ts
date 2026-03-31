import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Cliente } from './cliente.entity';
import { Propietario } from './propietario.entity';
import { Moneda } from './moneda.entity';

@Entity('factura')
export class Factura {
  @PrimaryGeneratedColumn({ name: 'FacturaId' })
  id: number;

  @Column({ name: 'FacturaFecha', type: 'date', nullable: true })
  fecha: Date;

  @Column({ name: 'ClienteId', nullable: true })
  clienteId: number;

  @Column({ name: 'FacturaImporte', type: 'decimal', precision: 14, scale: 2, nullable: true })
  importe: number;

  @Column({ name: 'FacturaSaldo', type: 'decimal', precision: 14, scale: 2, nullable: true })
  saldo: number;

  @Column({ name: 'FacturaObservacion', length: 60, nullable: true })
  observacion: string;

  @Column({ name: 'FacturaPropietarioId', nullable: true })
  propietarioId: number;

  @Column({ name: 'MonedaId', nullable: true })
  monedaId: number;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'ClienteId' })
  cliente: Cliente;

  @ManyToOne(() => Propietario, (p) => p.facturas)
  @JoinColumn({ name: 'FacturaPropietarioId' })
  propietario: Propietario;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'MonedaId' })
  moneda: Moneda;
}
