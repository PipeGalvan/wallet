# Tasks: Session Refresh Tokens

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~750–850 (new ~580 + modified ~230) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Backend base+servicio) → PR 2 (Backend wiring) → PR 3 (Frontend) |
| Delivery strategy | ask-always |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend base: entidad, SQL, cookie-parser, módulo, cookie.util + `RefreshTokenService` (TDD) | PR 1 | base=main; cimientos reutilizables y testeables en aislado |
| 2 | Backend wiring: auth.service (login/register/selectAccount/refresh/logout) + controller (TDD) | PR 2 | base=rama PR 1 (feature-branch-chain) o main (stacked) |
| 3 | Frontend: interceptor single-flight + store partialize + boot gate | PR 3 | base=rama PR 2 |

## Phase A: Backend — Prerequisitos

- [x] A.1 Agregar dependencia `cookie-parser` + `@types/cookie-parser` en `backend/package.json` (`npm i cookie-parser @types/cookie-parser`)
- [x] A.2 En `backend/src/main.ts`: `import cookieParser from 'cookie-parser'; app.use(cookieParser())` antes de `app.listen`
- [x] A.3 Crear `scripts/refreshtoken.sql` con el DDL de `design.md` (tabla `refreshtoken`, PK/FK/índices uq_hash/family/user/prop/replaced) y aplicarlo a la DB dev
- [x] A.4 Aceptar: la app bootea sin error al cargar la entidad (build OK; `scripts/refreshtoken.sql` debe ejecutarse manualmente en la DB dev — ver cabecera del script)

## Phase B: Backend — Entidad y módulo

- [x] B.1 Crear `backend/src/entities/refreshtoken.entity.ts` (TypeORM, espejo de SecUser: `@PrimaryGeneratedColumn({name:'RefreshTokenId'})`, columnas PascalCase `name:`, `@ManyToOne SecUser`, `PropietarioId` nullable, `FamilyId` CHAR(36), `TokenHash` CHAR(64), `ExpiresAt` DATETIME(3), `Revoked`, `ReplacedById`)
- [x] B.2 Exportar `RefreshToken` en `backend/src/entities/index.ts` (cargado por `Object.values(entities)` en app.module.ts)
- [x] B.3 En `backend/src/modules/auth/auth.module.ts`: agregar `RefreshToken` a `TypeOrmModule.forFeature([...])` y proveer `RefreshTokenService`

## Phase C: Backend — RefreshTokenService (TDD estricto)

- [x] C.1 RED: crear `refresh-token.service.spec.ts`; test `issue(secUserId,null)` genera raw opaco (`crypto.randomBytes(32).base64url`), `TokenHash=sha256(raw).hex`, `FamilyId` nuevo, `ExpiresAt=now+30d`, `Revoked=false`
- [x] C.2 RED: test `hashToken(raw)` = `createHash('sha256').update(raw).digest('hex')`
- [x] C.3 RED: test `validateAndRefresh(raw)` token no encontrado → 401, NO family-kill (assert `update WHERE FamilyId` NO llamado)
- [x] C.4 RED: test fila `Revoked=true` (reúso) → ejecuta `UPDATE ... SET Revoked=true WHERE FamilyId=X` → 401 + clear cookie (spec Req2 escenario reúso)
- [x] C.5 RED: test `ExpiresAt < now` → 401 + clear cookie (spec Req1 cookie expirada)
- [x] C.6 RED: test fila activa → rota: marca vieja `Revoked=true`+`ReplacedById`, inserta MISMA `FamilyId`/mismo scope, emite access 15m; scope NULL→payload user (con username/isAdmin), set→payload tenant (username:'' + propietarioId) (spec Req3 ambas direcciones)
- [x] C.7 RED: test rotación normal NO mata la familia (sólo la presentada queda revoked) (spec Req2 escenario normal)
- [x] C.8 GREEN: implementar `backend/src/modules/auth/refresh-token.service.ts` (`issue`/`rotate`/`validateAndRefresh`/`revokeFamily`) hasta verde; NO usar `JwtService.sign` (token opaco, D1)
- [x] C.9 Crear `backend/src/modules/auth/cookie.util.ts`: `setRefreshCookie(res, raw)` y `clearRefreshCookie(res)` (path `/api/v1/auth`, httpOnly, secure=`NODE_ENV==='production'`, sameSite:'lax', maxAge 30d)

## Phase D: Backend — auth.service wiring (TDD)

- [x] D.1 RED: test `login`/`register` llaman `RefreshTokenService.issue(user, null)` (user-scope, family nueva) y devuelven `refreshToken` raw junto a `{token,user,cuentas}`
- [x] D.2 RED: test `selectAccount` valida relación user↔propietario por `sub` (403 si inválida, sin rotar); si válida rota refresh a tenant-scope (misma family, revoke vieja) y devuelve `refreshToken` (spec Req4 ambos escenarios)
- [x] D.3 RED: test `refresh(raw)` delega a `RefreshTokenService.validateAndRefresh` y devuelve `{token,user,cuentas,tenant}` según scope de la fila
- [x] D.4 RED: test `logout(sub, raw)` revoca la familia entera de la fila actual (`revokeFamily`)
- [x] D.5 GREEN: modificar `auth.service.ts` — inyectar `RefreshTokenService`; `login`/`register`→`issue(user,null)`; `selectAccount`→rotate-to-tenant; agregar `refresh(raw)` y `logout(sub, raw)`; `getProfile` sin cambios
- [x] D.6 Refactor: extraer helper `signAccess(payload)` reutilizable (user vs tenant scope) para evitar duplicación

## Phase E: Backend — controller (TDD)

- [x] E.1 RED: test `POST /auth/refresh` lee cookie `refresh_token` (cookie-parser), SIN `JwtAuthGuard`, con `@UseGuards(ThrottlerGuard)`+`@Throttle` (D5: NO es global), éxito → setea cookie nueva + access 15m; stripp del envelope el `refreshToken` raw
- [x] E.2 RED: test `POST /auth/refresh` sin cookie o 401 del service → clear cookie + HTTP 401 (try/catch limpia cookie)
- [x] E.3 RED: test `POST /auth/logout` con `JwtAuthGuard` → clear cookie + HTTP 200
- [x] E.4 RED: test `login`/`register`/`selectAccount` setean la cookie y NO exponen `refreshToken` en el body (TransformInterceptor envelope limpio)
- [x] E.5 GREEN: modificar `auth.controller.ts` — `@Res({passthrough:true})` en login/register/selectAccount (set cookie, pop raw); agregar `POST refresh` (ThrottlerGuard+Throttle, no JwtAuthGuard) y `POST logout` (JwtAuthGuard)
- [x] E.6 Integración supertest: flujo refresh exitoso setea cookie nueva; throttle disparado a N+1 requests; scope binding e2e (decode JWT, Req3 ambas direcciones)
  - **Nota/deviación (slice 2):** cubierto a nivel UNITARIO (wiring del controller + metadata `@UseGuards(ThrottlerGuard)`/`@Throttle` vía Reflect + scope binding en `auth.service.refresh` tenant↔user + `refresh-token.service.spec` `buildAccessPayload`). No se ejecutó un flujo supertest real porque el proyecto no tiene harness supertest/e2e con DB. Recomendar un smoke e2e con DB en Phase H.

## Phase F: Frontend — Axios + interceptor single-flight

- [x] F.1 En `frontend/src/api/client.ts`: `withCredentials:true` en la instancia axios
- [x] F.2 Reemplazar el bloque 401→force-logout (líneas 18-26) por interceptor single-flight: `refreshPromise` a nivel módulo, cortocircuito `/auth/(login|refresh)`, retry con nuevo Bearer en éxito, logout+redirect `/login` en fallo (spec Req5 tres escenarios)
- [x] F.3 En `frontend/src/api/auth.ts`: agregar `refresh: () => api.post('/auth/refresh')` y `logout: () => api.post('/auth/logout')`

## Phase G: Frontend — store + boot gate

- [x] G.1 En `frontend/src/store/authStore.ts`: agregar `partialize` que EXCLUYA `token` (spec Req7: access sólo en memoria); agregar `setAccessToken(token,user,cuentas,tenant)` para restaurar sesión
- [x] G.2 En `frontend/src/hooks/useAuth.ts`: `handleLogout` llama `authApi.logout()` (fire-and-forget) antes de `logout()`+navigate
- [x] G.3 En `frontend/src/App.tsx`: boot gate `useEffect` — al montar, si `!token` llamar `authApi.refresh()` una vez, restaurar sesión en éxito, flag `bootstrapped` con loading; en fallo dejar no autenticado sin error (spec Req8 ambos escenarios)

## Phase H: Verificación manual (e2e)

- [ ] H.1 Smoke refresh: login → esperar >15m (o forzar expirado) → request protegido dispara refresh transparente → retry con nuevo access
- [ ] H.2 Detección de reúso: presentar token viejo → family kill → logout forzado en ambos clientes
- [ ] H.3 Switch de propietario: `selectAccount` rota refresh a tenant-scope y el Header account switcher sigue funcionando
- [ ] H.4 Logout limpia cookie + store; boot con cookie válida restaura sesión; boot sin cookie → login sin error
- [ ] H.5 Sanity cookies prod: httpOnly+Secure activos, no accesible vía `document.cookie`; access token fuera de localStorage (DevTools Application)
