# Design: Session Refresh Tokens

## Technical Approach

Opaque, rotating refresh tokens transported via `httpOnly` cookie; access token (15m) stays in memory only. Every refresh does a DB lookup by `sha256(token)` → the row is the single source of truth for `Revoked`, `ExpiresAt`, `PropietarioId` (scope) and `FamilyId` (reuse detection). `selectAccount` rotates the refresh to tenant-scope. Implements `session-management` spec (8 reqs, 17 scenarios) — no behavioral expansion.

## Architecture Decisions

| # | Decision | Options | Tradeoff | Choice |
|---|----------|---------|----------|--------|
| D1 | Refresh token format | (a) JWT signed w/ `JWT_REFRESH_SECRET` (b) **Opaque random** `crypto.randomBytes(32).toString('base64url')` | Spec MANDATES DB lookup on every refresh (Revoked check, scope-from-row, expiry, family). JWT's statelessness is therefore useless — signing adds crypto cost + a JWT/access-token confusion footgun, protects nothing. | **(b) Opaque random**, sha256-hex stored. ⚠️ Deviates from proposal's `JwtService.sign`+`JWT_REFRESH_SECRET`; see Open Questions Q1. |
| D2 | `FamilyId` type | (a) `CHAR(36)` UUID v4 (b) `BINARY(16)` | CHAR readable, index-friendly, matches proposal. | **(a) `CHAR(36)`** via `crypto.randomUUID()`. |
| D3 | `username`/`isAdmin` source for user-scope access | (a) Denormalize on row (b) **Re-fetch `SecUser`** | Row already has `SecUserId` FK; join avoids stale-username drift. Only needed when `PropietarioId IS NULL` (user-scope); tenant-scope uses `username:''`. | **(b) Re-fetch** via `ManyToOne SecUser` only on user-scope rotation. |
| D4 | Access token storage (FE) | (a) localStorage (b) **Memory** | Spec Req7 forbids cookie/localStorage for access. | **(b) Memory** — `partialize` excludes `token`. |
| D5 | Throttler on `/auth/refresh` | (a) Assume global `APP_GUARD` (b) **`@UseGuards(ThrottlerGuard)` per-route** | Audit: `ThrottlerGuard` is NOT registered globally in `app.module.ts` → `@Throttle` is inert without explicit guard. | **(b)** `@UseGuards(ThrottlerGuard)` + `@Throttle({ default:{ limit:10, ttl:60000 }})`. |
| D6 | Cookie scope | path `/api/v1/auth` | Cookie sent on login/refresh/logout/select-account — exactly the routes that need it; minimizes exposure. | path `/api/v1/auth`, `sameSite:'lax'`, `httpOnly:true`, `secure:NODE_ENV==='production'`. |
| D7 | `ReplacedById` constraint | (a) Self-FK (b) **Plain INT + index** | Self-FK adds cascade friction on rotation order; index is enough for chain audits. | **(b) Plain nullable INT, indexed.** |

## Entity — `RefreshToken` (`backend/src/entities/refreshtoken.entity.ts`)

```sql
CREATE TABLE refreshtoken (
  RefreshTokenId INT         NOT NULL AUTO_INCREMENT,
  SecUserId      INT         NOT NULL,
  PropietarioId  INT         NULL,              -- NULL=user-scope; set=tenant-scope
  FamilyId       CHAR(36)    NOT NULL,          -- uuid v4, reuse detection
  TokenHash      CHAR(64)    NOT NULL,          -- sha256(raw) hex; raw NEVER stored
  ExpiresAt      DATETIME(3) NOT NULL,
  Revoked        TINYINT(1)  NOT NULL DEFAULT 0,
  ReplacedById   INT         NULL,              -- chain pointer (no FK)
  CreatedAt      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UpdatedAt      DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (RefreshTokenId),
  UNIQUE KEY uq_refreshtoken_hash (TokenHash),
  KEY idx_refreshtoken_family (FamilyId),
  KEY idx_refreshtoken_user (SecUserId),
  KEY idx_refreshtoken_prop (PropietarioId),
  KEY idx_refreshtoken_replaced (ReplacedById),
  CONSTRAINT fk_refreshtoken_user FOREIGN KEY (SecUserId) REFERENCES secuser (SecUserId) ON DELETE CASCADE,
  CONSTRAINT fk_refreshtoken_prop FOREIGN KEY (PropietarioId) REFERENCES propietario (PropietarioId) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

TypeORM entity mirrors `SecUser` convention: `@PrimaryGeneratedColumn({name:'RefreshTokenId'}) id`, `@ManyToOne(() => SecUser)` `@JoinColumn({name:'SecUserId'})`, PascalCase `name:` on every column. **Must export in `entities/index.ts`** (loaded via `Object.values(entities)` in `app.module.ts`).

## RefreshTokenService Algorithm (`refresh-token.service.ts`)

```
issue(secUserId, propietarioId|null): {raw, row}
  raw = randomBytes(32).base64url; hash = sha256(raw).hex
  familyId = (existingFamily?) || randomUUID()
  insert row {SecUserId, PropietarioId, FamilyId=familyId, TokenHash=hash,
              ExpiresAt=now+30d, Revoked=false}; return {raw, row}

rotate(oldRow): {rawNew, accessToken, row}
  raw=issue(oldRow.SecUserId, oldRow.PropietarioId) // SAME familyId, SAME scope
  UPDATE oldRow SET Revoked=true, ReplacedById=newRow.id WHERE id=oldRow.id AND Revoked=false
  accessToken = sign {sub, ...(user-scope? {username,isAdmin} : {username:'', propietarioId})}
  return {rawNew:raw, accessToken, newRow}

validateAndRefresh(raw):
  if !raw → 401 (no cookie)
  row = findOne({TokenHash: sha256(raw)})            // index lookup
  if !row → 401 (garbage/forged) — NO family kill
  if row.Revoked → REUSE: UPDATE refreshtoken SET Revoked=true WHERE FamilyId=row.FamilyId
                    → 401 + clear cookie (logout)
  if row.ExpiresAt < now → 401 + clear cookie
  // active & valid → rotate, scope from ROW
  return rotate(row)   // access minted with row.PropietarioId (NULL→user, set→tenant)
```

Scope is read **only** from `row.PropietarioId` (spec Req3). `login`/`register` → `issue(user, null)` (new family). `selectAccount` validates `SecUserPropietario` by `sub`, then rotates current row → `issue(user, propietarioId)` keeping same family, revoking the prior row.

## Data Flow

```
Browser ──cookie(RefreshToken)──▶ POST /auth/refresh (ThrottlerGuard, NO JwtAuthGuard)
   │                                       │
   │                                  validateAndRefresh(raw)
   │                                       │
            ┌──────── sha256 ──▶ refreshtoken row ──▶ rotate / family-kill
            │                                       │
   ◀──Set-Cookie(new raw)──◀ Set-Cookie + access(15m, scope-from-row)
```

## Frontend Interceptor (single-flight) — `frontend/src/api/client.ts`

```ts
let refreshPromise: Promise<string | null> | null = null;
const SHORT_CIRCUIT = /\/auth\/(login|refresh)/;

api.interceptors.response.use(r => r, async (error) => {
  const cfg = error.config;
  if (error.response?.status === 401 && cfg && !cfg._retried && !SHORT_CIRCUIT.test(cfg.url)) {
    cfg._retried = true;
    if (!refreshPromise) {
      refreshPromise = authApi.refresh().then(({data}) => {
        const d = data.data ?? data;
        useAuthStore.getState().setAccessToken(d.token, d.user, d.cuentas, d.tenant);
        return d.token;
      }).catch(() => null).finally(() => { refreshPromise = null; });
    }
    const newToken = await refreshPromise;
    if (!newToken) { useAuthStore.getState().logout(); window.location.href = '/login'; return Promise.reject(error); }
    cfg.headers.Authorization = `Bearer ${newToken}`;
    return api(cfg);                  // retry original once
  }
  return Promise.reject(error);
});
```

Replaces the existing 401→force-logout block (lines 20–26). `withCredentials:true` on the axios instance. Boot gate (`App.tsx`): on mount, if `!token` call `authApi.refresh()` once; render a spinner while pending, on failure stay logged out (`bootstrapped` flag prevents blocking forever).

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/entities/refreshtoken.entity.ts` | New | `RefreshToken` entity (above). |
| `backend/src/entities/index.ts` | Modify | Export `RefreshToken`. |
| `backend/src/modules/auth/refresh-token.service.ts` | New | `issue`/`rotate`/`validateAndRefresh`/`revokeFamily`. |
| `backend/src/modules/auth/cookie.util.ts` | New | `setRefreshCookie(res, raw)`, `clearRefreshCookie(res)` (30d maxAge, flags D6). |
| `backend/src/modules/auth/auth.module.ts` | Modify | `forFeature([RefreshToken])`; provide `RefreshTokenService`. |
| `backend/src/modules/auth/auth.service.ts` | Modify | `login`/`register` call `issue(user,null)`; `selectAccount` calls rotate-to-tenant; add `refresh(raw)` + `logout(sub, raw)` returning `{token,user,cuentas,tenant,refreshToken(raw)}`. |
| `backend/src/modules/auth/auth.controller.ts` | Modify | Thread `@Res({passthrough:true})`; `login`/`register`/`selectAccount` set cookie (strip raw from envelope); add `POST refresh` (`@UseGuards(ThrottlerGuard)`+`@Throttle`, no JwtAuthGuard, try/catch clears cookie on 401); add `POST logout` (`@UseGuards(JwtAuthGuard)`). |
| `backend/src/main.ts` | Modify | `import cookieParser; app.use(cookieParser())`. |
| `backend/package.json` | Modify | Add `cookie-parser` dep. |
| `scripts/refreshtoken.sql` | New | DDL above (manual migration). |
| `frontend/src/api/client.ts` | Modify | Single-flight interceptor (above); `withCredentials:true`; remove old 401 logout. |
| `frontend/src/api/auth.ts` | Modify | Add `refresh()`, `logout()`. |
| `frontend/src/store/authStore.ts` | Modify | `partialize` excludes `token`; add `setAccessToken(token,user,cuentas,tenant)`. |
| `frontend/src/hooks/useAuth.ts` | Modify | `handleLogout` calls `authApi.logout()`; expose refresh result shape. |
| `frontend/src/App.tsx` | Modify | Boot-gate `useEffect` + `bootstrapped` loading state. |

## Testing Strategy (Strict TDD — backend)

| Layer | What | Approach |
|-------|------|----------|
| Unit `RefreshTokenService` | rotate marks old revoked + same family; validateAndRefresh branches: not-found(401,no-kill), revoked(family-kill UPDATE), expired(401), active(rotate); scope-from-row NULL→user payload / set→tenant payload | Jest + mocked repos; assert `UPDATE ... WHERE FamilyId` called only on reuse. |
| Unit `AuthService` | login/register issue user-scope (PropietarioId null, new family); selectAccount validates `sub`↔propietario (403 on invalid, no rotation), rotates to tenant-scope | Jest mocks. |
| Integration `/auth/refresh` | cookie present/absent/expired/reuse; throttle triggers; success sets new cookie + 15m access | supertest + test DB. |
| E2E scope binding | tenant-scope row → access has `propietarioId`; user-scope row → no `propietarioId` (spec Req3 both directions) | supertest decode JWT. |

## Migration / Rollout

Manual SQL `scripts/refreshtoken.sql` (no migration tool — prerequisite). Add `cookie-parser` dep. Rollback: revert code; `refreshtoken` table left inert or `DROP`; global logout clears cookies.

## Environment Additions

```
JWT_REFRESH_EXPIRES_IN=30d        # refresh row TTL (also cookie maxAge basis)
COOKIE_DOMAIN=                    # optional; omit for same-origin
# JWT_REFRESH_SECRET — NOT required under opaque-token decision (D1); see Q1
```

## Open Questions

- [ ] **Q1 (proposal deviation — needs orchestrator/user sign-off):** D1 chooses opaque random token, which makes the proposal's `JWT_REFRESH_SECRET` signing + its "default→no boot in prod" success criterion moot. Confirm acceptance, OR fall back to JWT-signed refresh (per-call `JwtService.sign({secret:JWT_REFRESH_SECRET, expiresIn:'30d'})`) at the cost of redundant crypto. Recommendation: **accept opaque**.
- [ ] **Q2:** Confirm cookie `name='refresh_token'` and that prod Nginx is same-origin (so `SameSite=Lax` + no `COOKIE_DOMAIN` sticks) — proposal risk #5.
