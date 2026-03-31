import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from './modules/auth/auth.module';
import { CajasModule } from './modules/cajas/cajas.module';
import { IngresosModule } from './modules/ingresos/ingresos.module';
import { EgresosModule } from './modules/egresos/egresos.module';
import { TransferenciasModule } from './modules/transferencias/transferencias.module';
import { ConversionesModule } from './modules/conversiones/conversiones.module';
import { FacturasModule } from './modules/facturas/facturas.module';
import { FacturasGastoModule } from './modules/facturas-gasto/facturas-gasto.module';
import { PlanillasGastosModule } from './modules/planillas-gastos/planillas-gastos.module';
import { PlanillasCobrosModule } from './modules/planillas-cobros/planillas-cobros.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { CatalogosModule } from './modules/catalogos/catalogos.module';
import { ReportesModule } from './modules/reportes/reportes.module';
import { AdminModule } from './modules/admin/admin.module';
import * as entities from './entities';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_DATABASE || 'nuntius',
      entities: Object.values(entities),
      synchronize: process.env.DB_SYNCHRONIZE === 'true',
      logging: process.env.NODE_ENV === 'development',
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '15m' },
    }),
    AuthModule,
    CajasModule,
    IngresosModule,
    EgresosModule,
    TransferenciasModule,
    ConversionesModule,
    FacturasModule,
    FacturasGastoModule,
    PlanillasGastosModule,
    PlanillasCobrosModule,
    ClientesModule,
    CatalogosModule,
    ReportesModule,
    AdminModule,
  ],
})
export class AppModule {}
