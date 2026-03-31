import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('moneda')
export class Moneda {
  @PrimaryColumn({ name: 'MonedaId' })
  id: number;

  @Column({ name: 'MonedaNombre', length: 40, nullable: true })
  nombre: string;
}
