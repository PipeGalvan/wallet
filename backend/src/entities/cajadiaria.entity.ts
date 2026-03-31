import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Caja } from './caja.entity';

@Entity('cajadiaria')
export class CajaDiaria {
  @PrimaryGeneratedColumn({ name: 'CajaDiariaId' })
  id: number;

  @Column({ name: 'CajaId', nullable: true })
  cajaId: number;

  @Column({ name: 'CajaDiariaFechaApertura', type: 'datetime', nullable: true })
  fechaApertura: Date;

  @Column({ name: 'CajaDiariaFechaCierre', type: 'datetime', nullable: true })
  fechaCierre: Date;

  @ManyToOne(() => Caja, (c) => c.cajasDiarias)
  @JoinColumn({ name: 'CajaId' })
  caja: Caja;
}
