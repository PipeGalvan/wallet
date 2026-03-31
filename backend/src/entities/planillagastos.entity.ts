import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Propietario } from './propietario.entity';
import { PlanillaGastosDetalle } from './planillagastosdetalle.entity';

@Entity('planillagastos')
export class PlanillaGastos {
  @PrimaryGeneratedColumn({ name: 'PlanillaGastosId' })
  id: number;

  @Column({ name: 'PlanillaGastosMes', nullable: true })
  mes: number;

  @Column({ name: 'PlanillaGastosAnio', nullable: true })
  anio: number;

  @Column({ name: 'PlanillaGastosNroDet', nullable: true })
  nroDet: number;

  @Column({ name: 'PropietarioId', nullable: true })
  propietarioId: number;

  @ManyToOne(() => Propietario, (p) => p.planillasGastos)
  @JoinColumn({ name: 'PropietarioId' })
  propietario: Propietario;

  @OneToMany(() => PlanillaGastosDetalle, (d) => d.planilla)
  detalles: PlanillaGastosDetalle[];
}
