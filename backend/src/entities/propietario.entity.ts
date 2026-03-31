import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Caja } from './caja.entity';
import { Cliente } from './cliente.entity';
import { TipoIngreso } from './tipoingreso.entity';
import { TipoEgreso } from './tipoegreso.entity';
import { Ingreso } from './ingreso.entity';
import { Egreso } from './egreso.entity';
import { Transferencia } from './transferencia.entity';
import { Factura } from './factura.entity';
import { FacturaGasto } from './facturagasto.entity';
import { PlanillaGastos } from './planillagastos.entity';
import { PlanillaCobros } from './planillacobros.entity';

@Entity('propietario')
export class Propietario {
  @PrimaryGeneratedColumn({ name: 'PropietarioId' })
  id: number;

  @Column({ name: 'PropietarioNombre', length: 40, nullable: true })
  nombre: string;

  @OneToMany(() => Caja, (c) => c.propietario)
  cajas: Caja[];

  @OneToMany(() => Cliente, (c) => c.propietario)
  clientes: Cliente[];

  @OneToMany(() => TipoIngreso, (t) => t.propietario)
  tiposIngreso: TipoIngreso[];

  @OneToMany(() => TipoEgreso, (t) => t.propietario)
  tiposEgreso: TipoEgreso[];

  @OneToMany(() => Ingreso, (i) => i.propietario)
  ingresos: Ingreso[];

  @OneToMany(() => Egreso, (e) => e.propietario)
  egresos: Egreso[];

  @OneToMany(() => Transferencia, (t) => t.propietario)
  transferencias: Transferencia[];

  @OneToMany(() => Factura, (f) => f.propietario)
  facturas: Factura[];

  @OneToMany(() => FacturaGasto, (f) => f.propietario)
  facturasGasto: FacturaGasto[];

  @OneToMany(() => PlanillaGastos, (p) => p.propietario)
  planillasGastos: PlanillaGastos[];

  @OneToMany(() => PlanillaCobros, (p) => p.propietario)
  planillasCobros: PlanillaCobros[];
}
