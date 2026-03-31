import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Propietario } from './propietario.entity';

@Entity('tipoegreso')
export class TipoEgreso {
  @PrimaryGeneratedColumn({ name: 'TipoEgresoId' })
  id: number;

  @Column({ name: 'TipoEgresoNombre', length: 40, nullable: true })
  nombre: string;

  @Column({ name: 'TipoEgresoActivo', nullable: true })
  activo: boolean;

  @Column({ name: 'PropietarioId', nullable: true })
  propietarioId: number;

  @Column({ name: 'TipoEgresoTransferencia', nullable: true })
  esTransferencia: boolean;

  @Column({ name: 'TipoEgresoCambio', nullable: true })
  esCambio: boolean;

  @ManyToOne(() => Propietario, (p) => p.tiposEgreso)
  @JoinColumn({ name: 'PropietarioId' })
  propietario: Propietario;
}
