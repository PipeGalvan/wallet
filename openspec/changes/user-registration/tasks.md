# Tasks: User Registration

## Phase 1: Backend - Types & Module Setup

- [x] 1.1 Agregar `Caja`, `TipoIngreso`, `TipoEgreso` al `TypeOrmModule.forFeature()` en `backend/src/modules/auth/auth.module.ts` e inyectar `DataSource` en el service
- [x] 1.2 Agregar `RegisterRequest` type en `frontend/src/types/auth.ts`

## Phase 2: Backend - Transactional Register

- [x] 2.1 Inyectar `DataSource` en `AuthService` constructor en `backend/src/modules/auth/auth.service.ts`
- [x] 2.2 Agregar validación de username duplicado: buscar en `userRepo` antes de crear, lanzar `ConflictException('El nombre de usuario ya existe')`
- [x] 2.3 Refactorizar `register()`: envolver en `this.dataSource.transaction(async (manager) => { ... })` creando SecUser (bcrypt hash), Propietario (nombre=username), SecUserPropietario (vinculo)
- [x] 2.4 Dentro de la transacción: crear `Caja` con nombre "Caja Principal", activa=true, propietarioId del nuevo propietario
- [x] 2.5 Dentro de la transacción: crear 3 `TipoIngreso` (Sueldo, Venta, Otro) y 4 `TipoEgreso` (Alquiler, Comida, Transporte, Otro) vinculados al propietario
- [x] 2.6 Fuera de la transacción (con el user creado): generar JWT con `jwtService.sign()` y devolver `{ token, user: { id, username, isAdmin: false }, cuentas: [propietario] }`

## Phase 3: Frontend - API & Auth Hook

- [x] 3.1 Agregar `register: (data: RegisterRequest) => api.post('/auth/register', data)` en `frontend/src/api/auth.ts`
- [x] 3.2 Agregar función `register()` en `frontend/src/hooks/useAuth.ts`: llama `authApi.register()`, hace `setAuth()`, auto-selecciona la cuenta única, navega a `/`. Catch con `toast.error('El nombre de usuario ya existe')` para 409

## Phase 4: Frontend - UI Pages

- [x] 4.1 Crear `frontend/src/pages/Register.tsx`: formulario con username, password, confirmar password. Validación client-side (passwords coinciden, campos no vacíos). Botón "Registrarse" con loading. Link "¿Ya tenés cuenta? Ingresá" → `/login`
- [x] 4.2 Agregar `<Route path="/register" element={<Register />} />` en `frontend/src/App.tsx`
- [x] 4.3 Agregar link "¿No tenés cuenta? Registrate" en `frontend/src/pages/Login.tsx` debajo del botón Ingresar

## Phase 5: Testing & Verification

- [ ] 5.1 Verificar: `POST /auth/register` con username nuevo → 201 con token + user + cuentas
- [ ] 5.2 Verificar: `POST /auth/register` con username existente → 409 con mensaje claro
- [ ] 5.3 Verificar: registro desde frontend → autologin → dashboard con caja y tipos visibles
- [ ] 5.4 Verificar: passwords no coinciden → error client-side, no se envía request
- [ ] 5.5 Verificar: link Login ↔ Register funciona en ambos sentidos
