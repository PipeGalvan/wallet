import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Propietario } from './propietario.entity';
import { PlanillaCobrosDetalle } from './planillacobrosdetalle.entity';

@Entity('planillacobros')
export class PlanillaCobros {
  @PrimaryGeneratedColumn({ name: 'PlanillaCobrosId' })
  id: number;

  @Column({ name: 'PlanillaCobrosMes', nullable: true })
  mes: number;

  @Column({ name: 'PlanillaCobrosAnio', nullable: true })
  anio: number;

  @Column({ name: 'PropietarioId', nullable: true })
  propietarioId: number;

  @Column({ name: 'PlanillaCobrosNroDet', nullable: true })
  nroDet: number;

  @ManyToOne(() => Propietario, (p) => p.planillasCobros)
  @JoinColumn({ name: 'PropietarioId' })
  propietario: Propietario;

  @OneToMany(() => PlanillaCobrosDetalle, (d) => d.planilla)
  detalles: PlanillaCobrosDetalle[];
}
