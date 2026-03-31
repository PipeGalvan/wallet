import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { UsuariosController } from './usuarios.controller';
import { RolesController } from './roles.controller';
import { SecUser } from '../../entities/secuser.entity';
import { SecRole } from '../../entities/secrole.entity';
import { SecUserPropietario } from '../../entities/secuserpropietario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SecUser, SecRole, SecUserPropietario])],
  controllers: [UsuariosController, RolesController],
  providers: [AdminService],
})
export class AdminModule {}
