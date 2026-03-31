import {
  Controller, Get, Post, Put, Body, Param, ParseIntPipe, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin/usuarios')
export class UsuariosController {
  constructor(private adminService: AdminService) {}

  @Get()
  findAll() {
    return this.adminService.findUsers();
  }

  @Post()
  create(@Body() body: { username: string; password: string }) {
    return this.adminService.createUser(body.username, body.password);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { username?: string; password?: string },
  ) {
    return this.adminService.updateUser(id, body.username, body.password);
  }

  @Post(':id/asociar-tenant')
  asociarTenant(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { propietarioId: number },
  ) {
    return this.adminService.asociarTenant(id, body.propietarioId);
  }
}
