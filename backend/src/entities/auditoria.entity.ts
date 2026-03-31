import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('auditoria')
export class Auditoria {
  @PrimaryGeneratedColumn({ name: 'AuditoriaId' })
  id: number;

  @Column({ name: 'Tabla', length: 50 })
  tabla: string;

  @Column({ name: 'RegistroId' })
  registroId: number;

  @Column({ name: 'Accion', type: 'enum', enum: ['INSERT', 'UPDATE', 'DELETE'] })
  accion: string;

  @Column({ name: 'DatosAnteriores', type: 'json', nullable: true })
  datosAnteriores: object;

  @Column({ name: 'DatosNuevos', type: 'json', nullable: true })
  datosNuevos: object;

  @Column({ name: 'SecUserId' })
  secUserId: number;

  @Column({ name: 'PropietarioId', nullable: true })
  propietarioId: number;

  @CreateDateColumn({ name: 'Fecha' })
  fecha: Date;
}
