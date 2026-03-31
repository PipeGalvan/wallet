import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Propietario } from './propietario.entity';
import { CajaDiaria } from './cajadiaria.entity';

@Entity('caja')
export class Caja {
  @PrimaryGeneratedColumn({ name: 'CajaId' })
  id: number;

  @Column({ name: 'CajaNombre', length: 40, nullable: true })
  nombre: string;

  @Column({ name: 'CajaFecha', type: 'date', nullable: true })
  fecha: Date;

  @Column({ name: 'CajaActivo', nullable: true })
  activo: boolean;

  @Column({ name: 'PropietarioId', nullable: true })
  propietarioId: number;

  @Column({ name: 'CajaTotalizar', nullable: true })
  totalizar: boolean;

  @ManyToOne(() => Propietario, (p) => p.cajas)
  @JoinColumn({ name: 'PropietarioId' })
  propietario: Propietario;

  @OneToMany(() => CajaDiaria, (c) => c.caja)
  cajasDiarias: CajaDiaria[];
}
