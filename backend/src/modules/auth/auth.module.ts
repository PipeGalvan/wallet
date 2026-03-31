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

@Module({
  imports: [
    TypeOrmModule.forFeature([SecUser, SecUserPropietario, Propietario]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}
