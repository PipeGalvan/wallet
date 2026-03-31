import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const tenantId = user.propietarioId;
    if (!tenantId) {
      throw new ForbiddenException('Debe seleccionar una cuenta');
    }

    request.tenantId = tenantId;
    return true;
  }
}
