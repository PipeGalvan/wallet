import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('admin/roles')
export class RolesController {
  constructor(private adminService: AdminService) {}

  @Get()
  findAll() {
    return this.adminService.findRoles();
  }
}
