## Why

Actualmente no existe forma de que un usuario nuevo se registre en la app. El endpoint `POST /auth/register` existe en el backend pero solo crea un `SecUser` sin generar la estructura necesaria para operar (Propietario, Caja, Tipos de ingreso/egreso). Sin un Propietario vinculado, el usuario queda trancado en la pantalla de selección de cuenta. Tampoco existe página de registro en el frontend.

## What Changes

- **Backend**: El `register` crea en una transacción: `SecUser` + `Propietario` + `SecUserPropietario` + `Caja` default + `TipoIngreso` básicos + `TipoEgreso` básicos. Valida username duplicado. Devuelve el mismo formato que login para que el usuario entre directo.
- **Frontend**: Nueva página `/register` con formulario (username + password + confirmar password). Link "Registrarse" en Login. Tras registro exitoso, login automático y redirección al dashboard.

## Capabilities

### New Capabilities

- `user-registration`: Flujo completo de registro de usuario (backend + frontend), incluyendo creación de datos iniciales para que el usuario pueda operar inmediatamente.

### Modified Capabilities

_(Ninguna)_

## Impact

| Area | Impact | Description |
|------|--------|-------------|
| `backend/src/modules/auth/auth.service.ts` | Modified | `register()` genera Propietario + vinculo + datos iniciales en transacción |
| `backend/src/modules/auth/dto/register.dto.ts` | Modified | Agregar validación de username duplicado |
| `backend/src/modules/auth/auth.controller.ts` | Modified | `register()` devuelve token + user + cuentas (mismo formato que login) |
| `frontend/src/pages/Register.tsx` | New | Página de registro |
| `frontend/src/App.tsx` | Modified | Agregar ruta `/register` |
| `frontend/src/pages/Login.tsx` | Modified | Link "¿No tenés cuenta? Registrate" |
| `frontend/src/hooks/useAuth.ts` | Modified | Agregar `register()` en el hook |
| `frontend/src/api/auth.ts` | Modified | Agregar llamada a `register` |
| `frontend/src/types/auth.ts` | Modified | Agregar `RegisterRequest` type |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Username duplicado | Med | Validar con query antes de crear, devolver error claro |
| Transacción falla a medias | Low | Usar transacción TypeORM (rollback automático) |
| Datos iniciales insuficientes | Low | Crear tipos genéricos ("Otro") como fallback siempre disponible |

## Rollback Plan

Revertir los cambios en backend y frontend. Los usuarios que se hayan registrado con la versión nueva seguirán funcionando porque las entidades creadas son válidas independientemente del código.

## Dependencies

- Ninguna dependencia externa nueva.

## Success Criteria

- [ ] Un usuario nuevo puede registrarse desde el frontend
- [ ] Tras registrarse, entra directo al dashboard sin pasar por "select-account"
- [ ] El usuario tiene una caja y tipos de ingreso/egreso básicos para operar
- [ ] Username duplicado muestra error claro
- [ ] No hay pantalla blanca ni estado trancado en ningún flujo
