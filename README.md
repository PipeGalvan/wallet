# Wallet - Sistema de Gestion Financiera

Plataforma de administracion financiera multitenant con gestion de cajas, movimientos, facturas y conversion de monedas. Construida sobre una base de datos MySQL existente (originalmente GeneXus) con compatibilidad total hacia atras.

---

## Stack Tecnologico

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Backend | NestJS (Node.js) | 10.3+ |
| ORM | TypeORM | 0.3.19+ |
| Auth | Passport.js + JWT | Stateless |
| Frontend | React + Vite | 18.2 / 5.0 |
| Estilos | Tailwind CSS | 3.4+ |
| Estado | Zustand (localStorage persist) | - |
| DB | MySQL | 5.7 |
| Deploy | Docker Compose | 3.8 |

---

## Inicio Rapido

```bash
# Clonar e iniciar
docker compose up -d --build

# Acceder
# Frontend: http://localhost
# Backend API: http://localhost:3000/api/v1
# MySQL: localhost:3308
```

### Credenciales por defecto

| Servicio | Usuario | Password |
|----------|---------|----------|
| App Web | admin | admin123 |
| MySQL | root | wallet_secret |

---

## Estructura del Proyecto

```
wallet/
├── docker-compose.yml
├── ARQUITECTURA.md              # Documentacion de arquitectura completa
├── Contexto.txt                 # Requerimientos originales del sistema
├── dump-nuntius-202603191915.sql # Dump original de la DB
│
├── backend/                     # NestJS API
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── main.ts              # Bootstrap, global prefix api/v1, CORS, ValidationPipe
│       ├── app.module.ts        # TypeORM MySQL, JwtModule, ThrottlerModule, 14 modulos
│       ├── common/              # Guards, decorators, interceptors, filters, types
│       │   ├── guards/          # JwtAuthGuard, TenantGuard
│       │   ├── decorators/      # @TenantId()
│       │   ├── interceptors/    # TransformInterceptor (envelope responses)
│       │   └── filters/         # HttpExceptionFilter (standardized errors)
│       ├── config/              # (config via env vars)
│       ├── entities/            # 22 entidades TypeORM mapeadas a tablas existentes
│       └── modules/             # 14 modulos de negocio
│           ├── auth/            # Login, register, select-account, JWT strategy
│           ├── cajas/           # CRUD + saldos + movimientos paginados
│           ├── ingresos/        # CRUD con filtros y paginacion
│           ├── egresos/         # CRUD con filtros y paginacion
│           ├── transferencias/  # Crear (transaccional: egreso+ingreso+registro)
│           ├── conversiones/    # Conversion de moneda (decimal.js para precision)
│           ├── facturas/        # CRUD + cobrar (transaccional)
│           ├── facturas-gasto/  # CRUD + pagar (transaccional)
│           ├── planillas-cobros/# Planillas mensuales + items + cobrar item
│           ├── planillas-gastos/# Planillas mensuales + items + pagar item
│           ├── clientes/        # CRUD
│           ├── catalogos/       # Tipos de ingreso/egreso, monedas
│           ├── reportes/        # Resumen, saldos, facturas pendientes
│           └── admin/           # Usuarios, roles
│
├── frontend/                    # React + Vite + Tailwind
│   ├── Dockerfile               # Nginx con proxy a backend
│   ├── package.json
│   └── src/
│       ├── main.tsx
│       ├── App.tsx              # Rutas + PrivateRoute
│       ├── api/                 # 10 clientes API (axios + interceptors)
│       ├── components/
│       │   ├── ui/              # Button, Input, Select, Modal, Table, Card, Badge, Spinner, EmptyState
│       │   ├── layout/          # AppLayout, Sidebar, Header
│       │   └── shared/          # CurrencyBadge, MoneyInput, ConfirmDialog
│       ├── hooks/               # useAuth (login, selectAccount, logout)
│       ├── pages/               # 14 paginas
│       ├── store/               # authStore (Zustand + persist)
│       ├── types/               # TypeScript interfaces
│       └── utils/               # formatMoney, formatDate, constants
│
└── docs/                        # Documentacion adicional
```

---

## Base de Datos

### Tablas Existentes (25 tablas, reutilizadas)

La base de datos original (`nuntius`) fue creada por un sistema GeneXus. Se mapearon todas las tablas existentes sin romper compatibilidad.

**Datos existentes:**

| Tabla | Registros | Descripcion |
|-------|-----------|-------------|
| `secuser` | 28 | Usuarios del sistema |
| `propietario` | 19 | Cuentas/Tenants |
| `caja` | 57 | Cajas financieras |
| `ingreso` | 1,929 | Movimientos de ingreso |
| `egreso` | 5,153 | Movimientos de egreso |
| `transferencia` | 721 | Transferencias entre cajas |
| `factura` | 29 | Facturas a cobrar |
| `facturagasto` | 48 | Facturas a pagar |
| `cliente` | 27 | Clientes |
| `moneda` | 2 | Pesos ($) y Dolar (USD) |

### Modelo ER

```
propietario (tenant) ──── 1:N ──── caja
                                │
                           1:N ──── cajadiaria
                                │
                          ┌─────┴──────┐
                     1:N ingreso   1:N egreso
                          │              │
                     N:1 tipoingreso N:1 tipoegreso
                     N:1 cliente
                     N:1 moneda       N:1 moneda

propietario ──── 1:N ──── factura ──── N:1 cliente
propietario ──── 1:N ──── facturagasto ──── N:1 tipoegreso
propietario ──── 1:N ──── planillacobros → planillacobrosdetalle
propietario ──── 1:N ──── planillagastos → planillagastosdetalle

secuser ──── N:M ──── propietario (via secuserpropietario)
secuser ──── N:M ──── secrole (via secuserrole)
secrole ──── N:M ──── secfunctionality (via secfunctionalityrole)
```

### Convenciones de la DB heredada

- PKs: `NombreTablaId` (ej: `CajaId`, `IngresoId`)
- FKs: nombre de columna explicito (ej: `IngresoPropietarioId`, `CajaDiariaId`)
- Passwords originales en base64 (compatibilidad: bcrypt primero, fallback a base64)
- Fechas centinela `1000-01-01` para indicar "sin cerrar"
- Charset mixto latin1/utf8

---

## Autenticacion y Multitenancy

### Flujo

```
1. POST /auth/login → { token, user, cuentas[] }
2. Si cuentas.length === 1 → auto-seleccionar
3. Si cuentas.length > 1 → pantalla de seleccion
4. POST /auth/select-account { propietarioId } → { token con tenant }
5. Todas las requests posteriores incluyen el JWT con propietarioId
6. TenantGuard extrae propietarioId del JWT y lo inyecta en request.tenantId
```

### JWT Payload

```json
{
  "sub": 1,
  "username": "admin",
  "isAdmin": true,
  "propietarioId": 1
}
```

### Seguridad

- JWT con expiracion configurable (`JWT_EXPIRES_IN`, default 15min)
- bcrypt para passwords nuevos (salt rounds 12)
- Fallback a base64 para passwords legacy del sistema GeneXus
- Rate limiting: 100 req/min via `@nestjs/throttler`
- TenantGuard en todos los endpoints de datos
- ValidationPipe global con whitelist y forbidNonWhitelisted

---

## API REST

**Base URL:** `/api/v1`

### Auth

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | `/auth/login` | Login con username/password |
| POST | `/auth/register` | Registro de nuevo usuario |
| POST | `/auth/select-account` | Seleccionar tenant |
| GET | `/auth/me` | Perfil actual |

### Cajas

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/cajas` | Listar cajas con saldos por moneda |
| GET | `/cajas/:id` | Detalle con saldos |
| POST | `/cajas` | Crear caja |
| PUT | `/cajas/:id` | Actualizar |
| DELETE | `/cajas/:id` | Desactivar |
| GET | `/cajas/:id/movimientos` | Movimientos paginados |

### Movimientos

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET/POST | `/ingresos` | Listar (paginado/filtrado) / Crear |
| GET/PUT/DELETE | `/ingresos/:id` | CRUD individual |
| GET/POST | `/egresos` | Listar (paginado/filtrado) / Crear |
| GET/PUT/DELETE | `/egresos/:id` | CRUD individual |

### Transferencias y Conversiones

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET/POST | `/transferencias` | Listar / Crear (transaccional) |
| GET/POST | `/conversiones` | Listar / Crear (decimal.js) |

### Facturas

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET/POST | `/facturas` | Listar / Crear |
| GET/PUT | `/facturas/:id` | Ver / Editar |
| POST | `/facturas/:id/cobrar` | Registrar cobro |
| GET/POST | `/facturas-gasto` | Listar / Crear |
| GET/PUT | `/facturas-gasto/:id` | Ver / Editar |
| POST | `/facturas-gasto/:id/pagar` | Registrar pago |

### Planillas

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET/POST | `/planillas-gastos` | Listar / Crear |
| GET | `/planillas-gastos/:id` | Detalle con items |
| POST | `/planillas-gastos/:id/items` | Agregar item |
| POST | `/planillas-gastos/:id/items/:detalleId/pagar` | Pagar item |
| *(idem)* | `/planillas-cobros` | Mismo patron con cobrar |

### Catalogos

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET/POST | `/tipos-ingreso` | Listar / Crear |
| PUT/DELETE | `/tipos-ingreso/:id` | Editar / Desactivar |
| GET/POST | `/tipos-egreso` | Listar / Crear |
| PUT/DELETE | `/tipos-egreso/:id` | Editar / Desactivar |

### Reportes

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET | `/reportes/resumen` | Ingresos/egresos por moneda con filtros de fecha |
| GET | `/reportes/saldos` | Saldos de todas las cajas |
| GET | `/reportes/facturas-pendientes` | Facturas con saldo > 0 |

### Admin

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| GET/POST | `/admin/usuarios` | Listar / Crear usuarios |
| PUT | `/admin/usuarios/:id` | Editar |
| POST | `/admin/usuarios/:id/asociar-tenant` | Asociar usuario a cuenta |
| GET | `/admin/roles` | Listar roles |

### Formato de respuesta estandar

```json
{
  "success": true,
  "data": {},
  "message": "OK"
}
```

### Paginacion

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

## Frontend - Paginas

### Flujo de navegacion

```
Login → Seleccion de Cuenta → Home (Cajas)
                                │
                                ├── Caja Detalle
                                │   ├── Registrar Ingreso
                                │   ├── Registrar Egreso
                                │   ├── Transferir a otra Caja
                                │   ├── Convertir Moneda
                                │   ├── Factura a Cobrar
                                │   └── Factura a Pagar
                                │
                                ├── Ingresos (listado global)
                                ├── Egresos (listado global)
                                ├── Transferencias
                                ├── Clientes
                                ├── Facturas a Cobrar
                                ├── Facturas a Pagar
                                ├── Planilla de Gastos
                                ├── Planilla de Cobros
                                ├── Informes
                                └── Configuracion
```

### Paginas implementadas (14)

| Pagina | Ruta | Estado |
|--------|------|--------|
| Login | `/login` | Completa |
| Seleccion de Cuenta | `/select-account` | Completa |
| Home (Cajas) | `/` | Completa |
| Caja Detalle | `/cajas/:id` | Completa - con 6 acciones |
| Ingresos | `/ingresos` | Completa |
| Egresos | `/egresos` | Completa |
| Transferencias | `/transferencias` | Completa |
| Clientes | `/clientes` | Completa |
| Facturas a Cobrar | `/facturas` | Completa - con cobrar |
| Facturas a Pagar | `/facturas-gasto` | Completa - con pagar |
| Planilla de Gastos | `/planilla-gastos` | Completa |
| Planilla de Cobros | `/planilla-cobros` | Completa |
| Informes | `/informes` | Completa |
| Configuracion | `/configuracion` | Completa |

---

## Docker

### Servicios

| Servicio | Puerto | Imagen |
|----------|--------|--------|
| frontend | 80 → 80 | Nginx (build propio) |
| backend | 3000 → 3000 | Node.js (build propio) |
| mysql | 3308 → 3306 | mysql:5.7 |

### Variables de entorno (backend)

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `DB_HOST` | mysql | Host de MySQL |
| `DB_PORT` | 3306 | Puerto interno |
| `DB_USERNAME` | root | Usuario DB |
| `DB_PASSWORD` | wallet_secret | Password DB |
| `DB_DATABASE` | nuntius | Nombre de la base |
| `JWT_SECRET` | wallet-jwt-secret... | Clave JWT |
| `JWT_EXPIRES_IN` | 15m | Expiracion token |
| `NODE_ENV` | production | Entorno |

### Comandos utiles

```bash
# Iniciar todo
docker compose up -d --build

# Ver logs
docker logs wallet-backend-1 -f
docker logs wallet-frontend-1 -f

# Reiniciar solo backend (despues de cambios)
docker compose up -d --build backend

# Acceder a MySQL
docker exec -it wallet-mysql-1 mysql -uroot -pwallet_secret nuntius

# Rebuild completo
docker compose down -v && docker compose up -d --build
```

---

## Decisiones de Diseno

### Precision financiera

- Backend: `DECIMAL(18,2)` en DB, `decimal.js` para calculos de conversion
- Frontend: `Intl.NumberFormat('es-AR')` para formateo
- Nunca se usa `float` para dinero

### Transacciones atomicas

Las operaciones que afectan multiples tablas usan `DataSource.transaction()`:

- **Transferencias**: crea egreso + ingreso + registro de transferencia
- **Conversiones**: crea egreso moneda origen + ingreso moneda destino + registro conversion
- **Cobrar factura**: crea ingreso + decrementa saldo factura
- **Pagar factura gasto**: crea egreso + decrementa saldo factura gasto
- **Pagar/cobrar item de planilla**: crea egreso/ingreso + marca item como pagado/cobrado

### Multitenancy

- Todas las tablas de datos tienen `PropietarioId`
- `TenantGuard` extrae el tenant del JWT y lo inyecta en `request.tenantId`
- `@TenantId()` decorator para obtenerlo en controllers
- Todos los servicios filtran por tenantId

### Mapeo de entidades TypeORM

Cada entidad usa `@Column({ name: 'NombreColumnaDB' })` para mapear a las columnas existentes, y `@ManyToOne` + `@JoinColumn({ name: '...' })` para las relaciones. Esto asegura que TypeORM use los nombres de columna reales de la DB y no genere columnas automaticas.

---

## Mejoras Futuras

### Corto plazo

- [ ] Migrar PKs de `smallint` a `INT` (limite actual: 32,767)
- [ ] Implementar saldos cacheados (tabla `saldocaja`)
- [ ] Migrar passwords restantes de base64 a bcrypt
- [ ] PWA con service worker
- [ ] Exportacion de reportes a PDF/Excel
- [ ] Paginacion en UI (los endpoints ya la soportan)
- [ ] Editar/eliminar movimientos desde la UI

### Mediano plazo

- [ ] Notificaciones push (vencimiento de facturas)
- [ ] API de cotizacion automatica (BCRA)
- [ ] Dashboard con graficos (Recharts/Chart.js)
- [ ] Adjuntar comprobantes a movimientos (S3)
- [ ] Auditoria completa (tabla `auditoria` ya definida como entidad)

### Largo plazo

- [ ] App movil (React Native)
- [ ] Multi-idioma (i18n)
- [ ] Real-time con WebSockets
- [ ] API publica para integraciones

---

## Lineas de Codigo

| Componente | Lineas |
|------------|--------|
| Backend (NestJS) | ~3,700 |
| Frontend (React) | ~3,100 |
| **Total** | **~6,800** |
