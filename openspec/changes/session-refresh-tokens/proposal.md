## Why

El access token expira en 15 minutos sin mecanismo de renovación, lo que fuerza re-login constante y no permite que la sesión sobreviva al cierre del navegador. Necesitamos refresh tokens seguros que encajen con el login de 2 pasos y el multitenant (el `TenantGuard` lee `propietarioId` del JWT).

## What Changes

### En Scope

- Endpoint `POST /auth/refresh` (público, throttler estricto, lee cookie).
- Endpoint `POST /auth/logout` (revoca familia + limpia cookie).
- Tabla + entidad `RefreshToken` (hash sha256, `familyId`, `propietarioId` nullable, `expiresAt`, `revoked`).
- Rotación obligatoria + **detección de reúso por familia** (reúso de token rotado → revoca la familia entera → logout forzado).
- Transporte: refresh en cookie `httpOnly + Secure(prod) + SameSite=Lax`, path `/api/v1/auth`; access token en **memoria** (Zustand sin persistir el token).
- Interceptor frontend **single-flight**: 401 → un único refresh en vuelo, retry con nuevo Bearer; `/auth/refresh` y `/auth/login` cortocircuitados.
- `selectAccount` **ROTA** el refresh token al scope del nuevo propietario (preserva el switcher de cuentas del Header).
- Boot gate: si hay cookie de refresh, llamar `/auth/refresh` al iniciar para restaurar sesión.

### Fuera de Scope

- Endpoint separado "switch-account" (no se agrega; se mantiene `selectAccount`).
- Revocación de tokens al cambiar password.
- Soporte mobile/native (solo web same-origin).
- Access token en `localStorage` (se elimina del flujo principal).

## Approach

**2-step crux — scope binding:** el refresh token lleva el scope del access token que emite.

- `login` → refresh **user-scope** (`propietarioId=null`) + access user-scope.
- `selectAccount(propietarioId)` → valida relación user↔propietario (usa `sub` del JWT) → **rota** refresh a **tenant-scope** (`propietarioId=X`) + access tenant-scope.
- `refresh` → lee cookie → sha256 → busca fila activa por hash → si `revoked` (ya rotada): **reúso detectado → revoca toda la familia** (`UPDATE ... SET revoked=true WHERE familyId=X`) → 401 + limpia cookie + logout. Si activa: rota (marca vieja revoked, inserta nueva misma familia), lee `propietarioId` **de la DB** (nunca del cliente), emite access con el MISMO scope, setea nueva cookie.

**Secrets / lifetimes:** `JwtService.sign/verifyAsync` por-llamada con `{ secret: JWT_REFRESH_SECRET, expiresIn: '30d' }`; access token `15m`. Fail-fast si `JWT_REFRESH_SECRET` es default en prod.

**SQL (manual, MySQL 5.7 — mismo naming que el repo):**

```sql
CREATE TABLE refreshtoken (
  RefreshTokenId INT         NOT NULL AUTO_INCREMENT,
  SecUserId      INT         NOT NULL,
  TokenHash      CHAR(64)    NOT NULL,                -- sha256 hex
  PropietarioId  INT         NULL,                    -- NULL = user-scope; set = tenant-scope
  FamilyId       CHAR(36)    NOT NULL,                -- uuid, detección de reúso
  ExpiresAt      DATETIME(3) NOT NULL,
  Revoked        TINYINT(1)  NOT NULL DEFAULT 0,
  ReplacedById   INT         NULL,
  CreatedAt      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UpdatedAt      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (RefreshTokenId),
  UNIQUE KEY uq_refreshtoken_hash (TokenHash),
  KEY idx_refreshtoken_family (FamilyId),
  KEY idx_refreshtoken_user (SecUserId),
  CONSTRAINT fk_refreshtoken_user FOREIGN KEY (SecUserId) REFERENCES secuser (SecUserId) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
-- PropietarioId: FK a propietario(PropietarioId) opcional; confirmar nombre exacto en spec.
```

## Capabilities

### New Capabilities

- `session-management`: gestión de sesión con refresh tokens rotativos (cookie httpOnly), detección de reúso por familia, rotación de scope en `selectAccount`, interceptor single-flight y logout.

### Modified Capabilities

- _(Ninguna — `openspec/specs/` está vacío; los cambios en login/selectAccount/register/logout se capturan como requirements dentro de `session-management`.)_

## Prerequisites (hard blockers)

1. **`cookie-parser` no está instalado** — agregar la dep y usarla en `main.ts` (`app.use(cookieParser())`).
2. **No hay migration tool en prod** — script SQL manual para `refreshtoken` (incluido arriba).

## Impact

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/modules/auth/auth.service.ts` | Modified | `login`/`selectAccount`/`register` setean cookie; nuevos `refresh()` y `logout()` |
| `backend/src/modules/auth/auth.controller.ts` | Modified | `POST /auth/refresh`, `POST /auth/logout`; `@Throttle` estricto en refresh |
| `backend/src/modules/auth/auth.module.ts` | Modified | Providers/servicios de refresh |
| `backend/src/entities/refreshtoken.entity.ts` | New | Entidad `RefreshToken` |
| `backend/src/entities/index.ts` | Modified | Exportar `RefreshToken` (cargado por `Object.values(entities)`) |
| `backend/src/main.ts` | Modified | `app.use(cookieParser())` |
| `frontend/src/api/client.ts` | Modified | Reemplazar interceptor 401 por single-flight; `withCredentials: true` |
| `frontend/src/store/authStore.ts` | Modified | `partialize`: persistir user/cuentas/tenant, NO el token |
| `frontend/src/hooks/useAuth.ts` + `api/auth.ts` | Modified | Llamadas `refresh`/`logout` |
| `frontend/src/App.tsx` | Modified | Boot refresh gate |
| `scripts/refreshtoken.sql` | New | Migración manual |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `propietarioId` mal en refresh rompe multitenancy silenciosamente | Med | Leer SIEMPRE de la DB row; TDD sobre cada scope |
| Olvidar rotar cookie en `selectAccount` → refresh user-scope stale válido | Med | `selectAccount` rota siempre; test de regresión |
| Nuevo interceptor 401 corre después del logout viejo → cada retry hace logout | Med | Reemplazar el interceptor existente; cortocircuitar `/auth/refresh` |
| `cookie-parser` no instalado (blocker) | High | Prerequisite #1 |
| Cookie prod no "pega" si `CORS_ORIGIN`/domain mal | Med | Same-origin Nginx + `SameSite=Lax`; verificar domain en prod |
| `JWT_REFRESH_SECRET` default en prod | Med | Fail-fast al boot |
| Throttler global 100/60s demasiado laxo para refresh | Med | `@Throttle` propio y estricto en `/auth/refresh` |

## Rollback Plan

Revertir backend y frontend. La tabla `refreshtoken` puede quedarse inerte o hacerse `DROP`. Los usuarios vuelven al flujo anterior (access token 15m únicamente). Ejecutar un `logout` global limpia cookies activas.

## Dependencies

- `cookie-parser` (npm — nueva dep backend).
- Variables de entorno: `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN` (= `30d`).
- Ningún migration tool (SQL manual).

## Success Criteria

- [ ] La sesión sobrevive al reinicio del navegador sin re-login (hasta 30d o logout).
- [ ] Reúso de un refresh rotado → revoca la familia + fuerza logout.
- [ ] Tras `selectAccount`, `/auth/refresh` emite access token tenant-scope correcto (multitenancy no se rompe).
- [ ] Múltiples 401 simultáneos disparan un único `/auth/refresh` (single-flight).
- [ ] `logout` revoca la familia y limpia la cookie.
- [ ] `JWT_REFRESH_SECRET` default → la app no bootea en prod (fail-fast).
