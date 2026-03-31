import { Entity, ManyToOne, PrimaryColumn, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { SecUser } from './secuser.entity';
import { Propietario } from './propietario.entity';

@Entity('secuserpropietario')
export class SecUserPropietario {
  @PrimaryColumn({ name: 'PropietarioId' })
  propietarioId: number;

  @PrimaryColumn({ name: 'SecUserId' })
  secUserId: number;

  @ManyToOne(() => Propietario)
  @JoinColumn({ name: 'PropietarioId' })
  propietario: Propietario;

  @ManyToOne(() => SecUser)
  @JoinColumn({ name: 'SecUserId' })
  user: SecUser;
}
