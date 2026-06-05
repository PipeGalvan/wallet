import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { SecUser } from '../../entities/secuser.entity';
import { SecUserPropietario } from '../../entities/secuserpropietario.entity';
import { Propietario } from '../../entities/propietario.entity';
import { Caja } from '../../entities/caja.entity';
import { TipoIngreso } from '../../entities/tipoingreso.entity';
import { TipoEgreso } from '../../entities/tipoegreso.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SecUser, SecUserPropietario, Propietario, Caja, TipoIngreso, TipoEgreso]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
