import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const user = request.user;
    const tenantId = request.tenantId;

    return next.handle().pipe(
      tap(() => {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          this.logger.log(
            `${method} ${url} - User: ${user?.sub || 'anonymous'} - Tenant: ${tenantId || 'none'}`,
          );
        }
      }),
    );
  }
}
