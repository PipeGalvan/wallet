import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TenantId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    return request.tenantId;
  },
);
