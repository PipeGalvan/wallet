import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { CajaDiaria } from './cajadiaria.entity';
import { Moneda } from './moneda.entity';
import { Propietario } from './propietario.entity';

@Entity('transferencia')
export class Transferencia {
  @PrimaryGeneratedColumn({ name: 'TransferenciaId' })
  id: number;

  @Column({ name: 'TransferenciaFecha', type: 'date', nullable: true })
  fecha: Date;

  @Column({ name: 'TransferenciaOrigenCajaDiariaId', nullable: true })
  origenCajaDiariaId: number;

  @Column({ name: 'TransferenciaDestinoCajaDiariaId', nullable: true })
  destinoCajaDiariaId: number;

  @Column({ name: 'MonedaId', nullable: true })
  monedaId: number;

  @Column({ name: 'TransferenciaImporte', type: 'decimal', precision: 14, scale: 2, nullable: true })
  importe: number;

  @Column({ name: 'TransferenciaPropietarioId', nullable: true })
  propietarioId: number;

  @ManyToOne(() => CajaDiaria)
  @JoinColumn({ name: 'TransferenciaOrigenCajaDiariaId' })
  origenCajaDiaria: CajaDiaria;

  @ManyToOne(() => CajaDiaria)
  @JoinColumn({ name: 'TransferenciaDestinoCajaDiariaId' })
  destinoCajaDiaria: CajaDiaria;

  @ManyToOne(() => Moneda)
  @JoinColumn({ name: 'MonedaId' })
  moneda: Moneda;

  @ManyToOne(() => Propietario, (p) => p.transferencias)
  @JoinColumn({ name: 'TransferenciaPropietarioId' })
  propietario: Propietario;
}
