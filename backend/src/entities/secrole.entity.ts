import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('secrole')
export class SecRole {
  @PrimaryGeneratedColumn({ name: 'SecRoleId' })
  id: number;

  @Column({ name: 'SecRoleName', length: 40 })
  name: string;

  @Column({ name: 'SecRoleDescription', length: 120 })
  description: string;
}
