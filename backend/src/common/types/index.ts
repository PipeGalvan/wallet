export interface JwtPayload {
  sub: number;
  username: string;
  propietarioId?: number;
  isAdmin?: boolean;
}

export interface TenantRequest extends Request {
  user?: JwtPayload;
  tenantId?: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
