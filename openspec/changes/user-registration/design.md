# Design: User Registration

## Technical Approach

El endpoint `POST /auth/register` existente se refactoriza para crear en una transacción TypeORM (`DataSource.transaction`) todas las entidades necesarias para que el usuario opere inmediatamente. La respuesta se unifica con el formato de login (`{ token, user, cuentas }`) para que el frontend haga autologin directo. Se agrega página de registro en React con validación client-side.

## Architecture Decisions

### Decision: Transactional registration con DataSource

**Choice**: Usar `this.dataSource.transaction(async (manager) => { ... })` — mismo patrón que TransferenciasService, FacturasService, etc.
**Alternatives**: Crear entidades sueltas sin transacción, usar QueryRunner manual
**Rationale**: El proyecto ya usa `DataSource.transaction` en 6 servicios. Seguir el patrón existente > inventar uno nuevo. Si falla cualquier paso, rollback automático.

### Decision: Username como nombre de Propietario

**Choice**: El `Propietario.nombre` se inicializa con el `username` del usuario
**Alternatives**: Pedir nombre display en el form de registro
**Rationale**: Fase 1 = simple. Menos campos = menos fricción. El usuario puede cambiarlo después desde Configuración si quiere. Reduce complejidad del formulario.

### Decision: Seed data hardcodeada en el service

**Choice**: Los tipos de ingreso/egreso iniciales se crean inline en el register como constantes del service
**Alternatives**: Tabla de seed separada, archivo JSON de config, endpoint de seed
**Rationale**: Son ~7 registros fijos. No justifica una abstracción extra. Si en el futuro se necesita configurabilidad, se extrae. YAGNI.

### Decision: Autologin en el response del register

**Choice**: El backend devuelve `{ token, user, cuentas }` idéntico a login
**Alternatives**: Devolver solo `{ id, username }` y hacer login por separado, devolver token sin cuentas
**Rationale**: Evita un round-trip extra. Como el usuario tiene exactamente 1 cuenta (recién creada), el frontend hace auto-select y entra directo al dashboard. Sin pasar por `/select-account`.

## Data Flow

```
Frontend /register                    Backend POST /auth/register
─────────────────                     ────────────────────────────
Form: username, pass, pass2
        │
        ▼
useAuth.register()
        │
        ▼
authApi.register(dto) ──────────→  ConflictException si username existe
        │                              │
        │                              ▼
        │                         dataSource.transaction {
        │                           create SecUser (bcrypt hash)
        │                           create Propietario (nombre=username)
        │                           create SecUserPropietario (vinculo)
        │                           create Caja ("Caja Principal")
        │                           create 3 TipoIngreso
        │                           create 4 TipoEgreso
        │                         }
        │                              │
        │                              ▼
        │                         jwtService.sign(payload)
        │                         return { token, user, cuentas }
        │
        ▼
setAuth(token, user, cuentas)
        │
        ▼
cuentas.length === 1 → selectAccount(auto)
        │
        ▼
navigate('/') → Dashboard
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `backend/src/modules/auth/auth.service.ts` | Modify | `register()` usa `DataSource.transaction`, crea 6 entidades, devuelve formato login |
| `backend/src/modules/auth/auth.module.ts` | Modify | Agregar `TypeOrmModule.forFeature([Caja, TipoIngreso, TipoEgreso])` e importar `DataSource` |
| `backend/src/modules/auth/dto/register.dto.ts` | Modify | Sin cambios (ya tiene username + password con MinLength(6)) |
| `frontend/src/pages/Register.tsx` | Create | Página de registro con form username + password + confirmar password |
| `frontend/src/App.tsx` | Modify | Agregar `<Route path="/register" element={<Register />} />` |
| `frontend/src/pages/Login.tsx` | Modify | Agregar link "¿No tenés cuenta? Registrate" |
| `frontend/src/hooks/useAuth.ts` | Modify | Agregar función `register()` que llama API y hace autologin |
| `frontend/src/api/auth.ts` | Modify | Agregar `register: (data) => api.post('/auth/register', data)` |
| `frontend/src/types/auth.ts` | Modify | Agregar `RegisterRequest` type |

## Interfaces / Contracts

### Backend Response (unificado con login)

```typescript
// POST /auth/register response
{
  token: string;          // JWT con { sub, username, isAdmin }
  user: { id, username, isAdmin: false };
  cuentas: [{ id, nombre }]  // length siempre 1 (recién creado)
}
```

### Frontend Types

```typescript
interface RegisterRequest {
  username: string;
  password: string;
}
```

### Seed data constants

```typescript
const SEED_TIPOS_INGRESO = ['Sueldo', 'Venta', 'Otro'];
const SEED_TIPOS_EGRESO = ['Alquiler', 'Comida', 'Transporte', 'Otro'];
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit (backend) | `register()` crea todas las entidades, rollback en error, username duplicado | Jest + mock DataSource transaction |
| Integration (backend) | `POST /auth/register` end-to-end con DB real | Supertest contra test DB |
| Unit (frontend) | Validación de passwords, submit exitoso, errores | React Testing Library |
| E2E | Flujo completo: registro → dashboard con datos iniciales | Playwright / manual |

## Migration / Rollout

No migration required. No hay cambios en esquema de DB. Los usuarios existentes no se ven afectados.

## Open Questions

- [ ] ¿Los tipos de ingreso/egreso del seed son los correctos? Confirmar con el usuario.
