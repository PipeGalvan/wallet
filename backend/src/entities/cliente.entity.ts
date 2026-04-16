import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Propietario } from './propietario.entity';

@Entity('cliente')
export class Cliente {
  @PrimaryGeneratedColumn({ name: 'ClienteId' })
  id: number;

  @Column({ name: 'ClienteNombre', length: 40, nullable: true })
  nombre: string;

  @Column({ name: 'PropietarioId', nullable: true })
  propietarioId: number;

  @Column({ name: 'ClienteObservaciones', type: 'mediumtext', nullable: true })
  observaciones: string;

  @Column({ name: 'ClienteActivo', nullable: true, default: true })
  activo: boolean;

  @ManyToOne(() => Propietario, (p) => p.clientes)
  @JoinColumn({ name: 'PropietarioId' })
  propietario: Propietario;
}
