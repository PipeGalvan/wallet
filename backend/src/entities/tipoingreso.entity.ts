import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Propietario } from './propietario.entity';

@Entity('tipoingreso')
export class TipoIngreso {
  @PrimaryGeneratedColumn({ name: 'TipoIngresoId' })
  id: number;

  @Column({ name: 'TipoIngresoActivo', nullable: true })
  activo: boolean;

  @Column({ name: 'TipoIngresoNombre', length: 40, nullable: true })
  nombre: string;

  @Column({ name: 'PropietarioId', nullable: true })
  propietarioId: number;

  @Column({ name: 'TipoIngresoTransferencia', nullable: true })
  esTransferencia: boolean;

  @Column({ name: 'TipoIngresoCambio', nullable: true })
  esCambio: boolean;

  @ManyToOne(() => Propietario, (p) => p.tiposIngreso)
  @JoinColumn({ name: 'PropietarioId' })
  propietario: Propietario;
}
