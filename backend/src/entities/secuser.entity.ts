import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { SecRole } from './secrole.entity';

@Entity('secuser')
export class SecUser {
  @PrimaryGeneratedColumn({ name: 'SecUserId' })
  id: number;

  @Column({ name: 'SecUserName', length: 100 })
  username: string;

  @Column({ name: 'SecUserPassword', length: 100 })
  password: string;

  @Column({ name: 'SecUserKey', type: 'varchar', length: 100, nullable: true })
  key: string;

  @Column({ name: 'SecUserAdmin', nullable: true })
  isAdmin: boolean;

  @ManyToMany(() => SecRole)
  @JoinTable({
    name: 'secuserrole',
    joinColumn: { name: 'SecUserId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'SecRoleId', referencedColumnName: 'id' },
  })
  roles: SecRole[];
}
