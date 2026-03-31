# Wallet - Arquitectura del Sistema

---

## 1. Analisis de la Base de Datos Existente

### 1.1 Entidades Identificadas (25 tablas)

| Tabla | Descripcion | PK | Tenant |
|---|---|---|---|
| `propietario` | Cuenta/Tenant (multitenancy) | PropietarioId | - |
| `secuser` | Usuarios del sistema | SecUserId | - |
| `secuserpropietario` | Relacion usuario-tenant (N:M) | Compuesta | - |
| `secrole` | Roles de seguridad | SecRoleId | - |
| `secuserrole` | Relacion usuario-rol (N:M) | Compuesta | - |
| `secfunctionality` | Funcionalidades del sistema | SecFunctionalityId | - |
| `secfunctionalityrole` | Relacion funcionalidad-rol (N:M) | Compuesta | - |
| `secobject` | Objetos de seguridad | SecObjectName | - |
| `secobjectfunctionalities` | Relacion objeto-funcionalidad | Compuesta | - |
| `caja` | Wallets/cuentas financieras | CajaId | PropietarioId |
| `cajadiaria` | Registro diario por caja | CajaDiariaId | via CajaId |
| `moneda` | Monedas (ARS, USD) | MonedaId | Global |
| `cliente` | Clientes | ClienteId | PropietarioId |
| `tipoingreso` | Tipos de ingreso | TipoIngresoId | PropietarioId |
| `tipoegreso` | Tipos de egreso | TipoEgresoId | PropietarioId |
| `ingreso` | Movimientos de ingreso | IngresoId | PropietarioId |
| `egreso` | Movimientos de egreso | EgresoId | PropietarioId |
| `transferencia` | Transferencias entre cajas | TransferenciaId | PropietarioId |
| `factura` | Facturas a cobrar | FacturaId | PropietarioId |
| `facturagasto` | Facturas a pagar | FacturaGastoId | PropietarioId |
| `planillagastos` | Planilla de gastos mensual | PlanillaGastosId | PropietarioId |
| `planillagastosdetalle` | Detalle planilla gastos | Compuesta | via PlanillaGastosId |
| `planillacobros` | Planilla de cobros mensual | PlanillaCobrosId | PropietarioId |
| `planillacobrosdetalle` | Detalle planilla cobros | Compuesta | via PlanillaCobrosId |
| `wwp_parameter` | Parametros del sistema | WWPParameterKey | Global |

### 1.2 Relaciones Principales

```
propietario (1) --- (N) caja
propietario (1) --- (N) cliente
propietario (1) --- (N) tipoingreso
propietario (1) --- (N) tipoegreso
propietario (1) --- (N) ingreso
propietario (1) --- (N) egreso
propietario (1) --- (N) transferencia
propietario (1) --- (N) factura
propietario (1) --- (N) facturagasto
propietario (1) --- (N) planillagastos
propietario (1) --- (N) planillacobros

caja (1) --- (N) cajadiaria
cajadiaria (1) --- (N) ingreso
cajadiaria (1) --- (N) egreso
moneda (1) --- (N) ingreso
moneda (1) --- (N) egreso
moneda (1) --- (N) transferencia
cliente (1) --- (N) ingreso
cliente (1) --- (N) factura
tipoingreso (1) --- (N) ingreso
tipoegreso (1) --- (N) egreso

secuser (N) --- (M) propietario  (via secuserpropietario)
secuser (N) --- (M) secrole      (via secuserrole)
secrole (N) --- (M) secfunctionality (via secfunctionalityrole)

transferencia: cajadiaria(origen) + cajadiaria(destino)
```

### 1.3 Problemas de Diseno Identificados

| Problema | Impacto | Solucion Propuesta |
|---|---|---|
| **PKs con `smallint`** (max 32767) | Limite de registros en egreso (5264), ingreso (2004), transferencia (803) | Migrar a `INT` o `BIGINT` con ALTER TABLE progresivo |
| **Passwords en base64** (no hash) | Seguridad critica | Migrar a bcrypt en nuevo sistema, mantener compatibilidad durante transicion |
| **`cajadiaria` como intermediario obligatorio** | Complejidad innecesaria para registrar movimientos | Simplificar: permitir movimientos directos a caja, mantener cajadiaria para cierres |
| **Charset mixto** (latin1 + utf8) | Problemas con acentos y caracteres especiales | Migrar todo a `utf8mb4` |
| **Sin auditoria** | Imposible rastrear cambios en movimientos | Crear tabla `auditoria_movimiento` |
| **Sin tabla de conversion de moneda** | Conversiones registradas solo como tipo de egreso/ingreso | Crear tabla `conversionmoneda` |
| **Valor centinela `1000-01-01`** para fechas | Anti-patron, confuso | Usar `NULL` para indicar "sin cerrar" |
| **Sin soft delete** | Eliminaciones fisicas pierden historial | Agregar campo `Eliminado` en tablas de movimientos |
| **Campos `varchar` cortos** (60 chars) | Limitantes para usuarios | Ampliar a `TEXT` o `VARCHAR(500)` |
| **Tabla `wwp_parameter` vacia** | Restos del sistema anterior (GeneXus) | Limpiar o reutilizar |

### 1.4 Mejoras Progresivas (sin romper compatibilidad)

```sql
-- Fase 1: Ampliar PKs criticas
ALTER TABLE egreso MODIFY EgresoId INT NOT NULL AUTO_INCREMENT;
ALTER TABLE ingreso MODIFY IngresoId INT NOT NULL AUTO_INCREMENT;
ALTER TABLE transferencia MODIFY TransferenciaId INT NOT NULL AUTO_INCREMENT;
ALTER TABLE cajadiaria MODIFY CajaDiariaId INT NOT NULL AUTO_INCREMENT;
ALTER TABLE caja MODIFY CajaId INT NOT NULL AUTO_INCREMENT;
ALTER TABLE factura MODIFY FacturaId INT NOT NULL AUTO_INCREMENT;
ALTER TABLE facturagasto MODIFY FacturaGastoId INT NOT NULL AUTO_INCREMENT;
ALTER TABLE cliente MODIFY ClienteId INT NOT NULL AUTO_INCREMENT;

-- Fase 2: Agregar columnas nuevas
ALTER TABLE ingreso ADD COLUMN Eliminado TINYINT(1) DEFAULT 0;
ALTER TABLE egreso ADD COLUMN Eliminado TINYINT(1) DEFAULT 0;
ALTER TABLE ingreso ADD COLUMN CajaId INT DEFAULT NULL;
ALTER TABLE egreso ADD COLUMN CajaId INT DEFAULT NULL;

-- Fase 3: Crear tablas nuevas
CREATE TABLE conversionmoneda (
  ConversionId INT NOT NULL AUTO_INCREMENT,
  CajaId INT NOT NULL,
  MonedaOrigenId SMALLINT NOT NULL,
  MonedaDestinoId SMALLINT NOT NULL,
  TipoCambio DECIMAL(18,6) NOT NULL,
  ImporteOrigen DECIMAL(18,2) NOT NULL,
  ImporteDestino DECIMAL(18,2) NOT NULL,
  Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
  PropietarioId SMALLINT NOT NULL,
  PRIMARY KEY (ConversionId)
);

CREATE TABLE auditoria (
  AuditoriaId BIGINT NOT NULL AUTO_INCREMENT,
  Tabla VARCHAR(50) NOT NULL,
  RegistroId INT NOT NULL,
  Accion ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  DatosAnteriores JSON DEFAULT NULL,
  DatosNuevos JSON DEFAULT NULL,
  SecUserId SMALLINT NOT NULL,
  PropietarioId SMALLINT DEFAULT NULL,
  Fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (AuditoriaId)
);

CREATE TABLE saldocaja (
  SaldoCajaId INT NOT NULL AUTO_INCREMENT,
  CajaId INT NOT NULL,
  MonedaId SMALLINT NOT NULL,
  Saldo DECIMAL(18,2) NOT NULL DEFAULT 0,
  FechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (SaldoCajaId),
  UNIQUE KEY UK_SALDO (CajaId, MonedaId)
);
```

---

## 2. Arquitectura del Sistema

### 2.1 Vision General

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│              React + Tailwind CSS                   │
│           (SPA / PWA - responsive)                  │
├─────────────────────────────────────────────────────┤
│                    API GATEWAY                      │
│              NestJS (Express)                       │
│         JWT Auth + Multitenant Guard                │
├──────────┬──────────┬──────────┬────────────────────┤
│   Auth   │  Wallet  │  Billing │    Reports         │
│ Module   │ Module   │ Module   │    Module          │
├──────────┴──────────┴──────────┴────────────────────┤
│              DATABASE LAYER                         │
│          TypeORM + MySQL existente                  │
└─────────────────────────────────────────────────────┘
```

### 2.2 Stack Tecnologico

| Capa | Tecnologia | Justificacion |
|---|---|---|
| **Frontend** | React 18+ con Vite | Rapido, ecosistema maduro, SPA eficiente |
| **Estilos** | Tailwind CSS 3+ | Desarrollo rapido, responsive, consistente |
| **Estado** | Zustand + React Query | Zustand para estado global, React Query para cache de API |
| **Formularios** | React Hook Form + Zod | Validacion declarativa, rendimiento |
| **Backend** | NestJS (Node.js) | Arquitectura modular, DI, decorators, escalable |
| **ORM** | TypeORM | Compatible MySQL, decorators, migrations |
| **Auth** | Passport.js + JWT | Estandar en NestJS, stateless |
| **DB** | MySQL 5.7+ | Existente en produccion |
| **Build** | Vite | HMR rapido, bundling optimizado |
| **Testing** | Jest + React Testing Library | Estandar en ambos ecosistemas |

### 2.3 Principios de Arquitectura

1. **Multitenancy a nivel de aplicacion**: Todas las queries filtran por `PropietarioId` obtenido del JWT
2. **Separacion por modulos**: Cada dominio funcional es un modulo NestJS independiente
3. **DTOs estrictos**: Validacion de entrada con class-validator en cada endpoint
4. **Transacciones financieras**: Uso de transacciones DB para operaciones que afectan saldos
5. **Precision financiera**: Tipo `DECIMAL(18,2)` en DB, libreria `decimal.js` en backend, nunca `float`
6. **Idempotencia**: Clave de idempotencia en operaciones financieras para evitar duplicacion

---

## 3. Modelo de Datos (Adaptado)

### 3.1 Tablas Existentes (reutilizadas)

```
propietario        -> Propietario (tenant)
secuser            -> Usuario
secuserpropietario -> UsuarioTenant (N:M)
secrole            -> Rol
secuserrole        -> UsuarioRol (N:M)
secfunctionality   -> Funcionalidad
secfunctionalityrole -> FuncionalidadRol (N:M)
caja               -> Caja (wallet)
cajadiaria         -> CajaDiaria (sesion diaria)
moneda             -> Moneda
cliente            -> Cliente
tipoingreso        -> TipoIngreso
tipoegreso         -> TipoEgreso
ingreso            -> Ingreso (movimiento)
egreso             -> Egreso (movimiento)
transferencia      -> Transferencia
factura            -> Factura (a cobrar)
facturagasto       -> FacturaGasto (a pagar)
planillagastos     -> PlanillaGastos
planillagastosdetalle -> PlanillaGastosDetalle
planillacobros     -> PlanillaCobros
planillacobrosdetalle -> PlanillaCobrosDetalle
```

### 3.2 Tablas Nuevas (agregadas)

```
conversionmoneda   -> ConversionMoneda (conversiones entre monedas)
auditoria          -> Auditoria (trail de cambios)
saldocaja          -> SaldoCaja (cache de saldo por caja/moneda)
```

### 3.3 Diagrama ER Simplificado

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────┐
│  propietario │1─────N│      caja        │N─────1│   moneda     │
│  (tenant)    │       │  (+saldocaja)    │       │  (ARS, USD)  │
└──────┬───────┘       └────────┬─────────┘       └──────────────┘
       │                        │
       │               ┌────────┴─────────┐
       │               │                  │
       │        ┌──────┴──────┐    ┌──────┴──────┐
       │        │ cajadiaria  │    │conversionmoneda│
       │        └──────┬──────┘    └─────────────┘
       │               │
       │        ┌──────┴──────────────────────┐
       │        │                             │
       │   ┌────┴─────┐              ┌────────┴───┐
       │   │ ingreso  │              │   egreso   │
       │   └──┬──┬──┬─┘              └──┬──┬──┬───┘
       │      │  │  │                    │  │  │
       │      │  │  └── tipoingreso      │  │  └── tipoegreso
       │      │  └───── moneda           │  └───── moneda
       │      └──────── cliente          └────────
       │
       │   ┌──────────────┐    ┌────────────────┐
       │   │  factura     │    │ facturagasto   │
       │   │(a cobrar)    │    │(a pagar)       │
       │   └──────────────┘    └────────────────┘
       │
       │   ┌────────────────────────┐    ┌──────────────────────┐
       │   │    transferencia       │    │  planillagastos      │
       │   │ (cajaOrig->cajaDest)   │    │  planillacobros      │
       │   └────────────────────────┘    └──────────────────────┘
       │
┌──────┴───────┐       ┌──────────────┐
│   secuser    │N─────M│  propietario │
│              │       │  (via secuser│
│              │       │  propietario)│
└──────┬───────┘       └──────────────┘
       │
       │N────M secrole (via secuserrole)
```

---

## 4. Diseno de APIs REST

### 4.1 Convenciones

- Base URL: `/api/v1`
- Autenticacion: Bearer JWT en header `Authorization`
- Tenant: Se obtiene del JWT (claim `propietarioId`)
- Content-Type: `application/json`
- Paginacion: `?page=1&limit=20`
- Filtros: `?fechaDesde=2024-01-01&fechaHasta=2024-12-31&monedaId=1`

### 4.2 Endpoints

#### Auth

```
POST   /auth/login              { username, password } -> { token, user, propietarios[] }
POST   /auth/select-account     { propietarioId }     -> { token (con tenant) }
POST   /auth/register           { username, password, email } -> { user }
POST   /auth/refresh            { refreshToken }       -> { token }
GET    /auth/me                 -> { user, propietarioActual }
```

#### Cajas (Wallets)

```
GET    /cajas                   -> Listar cajas del tenant con saldo
POST   /cajas                   { nombre, fecha } -> Crear caja
GET    /cajas/:id               -> Detalle de caja con saldos por moneda
PUT    /cajas/:id               { nombre, activo } -> Actualizar
DELETE /cajas/:id               -> Desactivar (soft delete)
GET    /cajas/:id/saldos        -> Saldos por moneda
GET    /cajas/:id/movimientos   -> Movimientos paginados (ingresos+egresos)
```

#### Ingresos

```
GET    /ingresos                           -> Listar (paginado, filtrable)
POST   /ingresos                           { fecha, tipoIngresoId, clienteId?, observacion, monedaId, importe, cajaId }
GET    /ingresos/:id                       -> Detalle
PUT    /ingresos/:id                       -> Actualizar
DELETE /ingresos/:id                       -> Soft delete
```

#### Egresos

```
GET    /egresos                            -> Listar (paginado, filtrable)
POST   /egresos                            { fecha, tipoEgresoId, observacion, monedaId, importe, cajaId }
GET    /egresos/:id                        -> Detalle
PUT    /egresos/:id                        -> Actualizar
DELETE /egresos/:id                        -> Soft delete
```

#### Transferencias

```
GET    /transferencias                     -> Listar
POST   /transferencias                     { cajaOrigenId, cajaDestinoId, monedaId, importe, fecha }
GET    /transferencias/:id                 -> Detalle
```

#### Conversiones de Moneda

```
GET    /conversiones                       -> Listar conversiones
POST   /conversiones                       { cajaId, monedaOrigenId, monedaDestinoId, tipoCambio, importe }
GET    /conversiones/:id                   -> Detalle
```

#### Facturas a Cobrar

```
GET    /facturas                           -> Listar facturas con saldo pendiente
POST   /facturas                           { fecha, clienteId, importe, monedaId, observacion }
GET    /facturas/:id                       -> Detalle con historial de cobros
PUT    /facturas/:id                       -> Actualizar
POST   /facturas/:id/cobrar                { importe, cajaId, monedaId } -> Genera ingreso
```

#### Facturas a Pagar

```
GET    /facturas-gasto                     -> Listar facturas de gasto
POST   /facturas-gasto                     { fecha, tipoEgresoId, importe, monedaId, observacion, fechaVencimiento }
GET    /facturas-gasto/:id                 -> Detalle
PUT    /facturas-gasto/:id                 -> Actualizar
POST   /facturas-gasto/:id/pagar           { importe, cajaId, monedaId } -> Genera egreso
```

#### Planillas de Gastos

```
GET    /planillas-gastos                   -> Listar planillas
POST   /planillas-gastos                   { mes, anio } -> Crear planilla mensual
GET    /planillas-gastos/:id               -> Detalle con items
POST   /planillas-gastos/:id/items         { tipoEgresoId, importe, monedaId }
PUT    /planillas-gastos/:id/items/:itemId { importe, pagado }
POST   /planillas-gastos/:id/items/:itemId/pagar { cajaId } -> Registra egreso
```

#### Planillas de Cobros

```
GET    /planillas-cobros                   -> Listar planillas
POST   /planillas-cobros                   { mes, anio } -> Crear planilla mensual
GET    /planillas-cobros/:id               -> Detalle con items
POST   /planillas-cobros/:id/items         { tipoIngresoId, clienteId, importe, monedaId }
PUT    /planillas-cobros/:id/items/:itemId { importe, pagado }
POST   /planillas-cobros/:id/items/:itemId/cobrar { cajaId } -> Registra ingreso
```

#### Clientes

```
GET    /clientes                           -> Listar
POST   /clientes                           { nombre, observaciones }
GET    /clientes/:id                       -> Detalle
PUT    /clientes/:id                       -> Actualizar
DELETE /clientes/:id                       -> Soft delete
```

#### Catalogos (Configuracion)

```
GET    /tipos-ingreso                      -> Listar
POST   /tipos-ingreso                      { nombre, activo }
PUT    /tipos-ingreso/:id                  -> Actualizar
DELETE /tipos-ingreso/:id                  -> Desactivar

GET    /tipos-egreso                       -> Listar
POST   /tipos-egreso                       { nombre, activo }
PUT    /tipos-egreso/:id                   -> Actualizar
DELETE /tipos-egreso/:id                   -> Desactivar
```

#### Informes

```
GET    /reportes/resumen                   ?fechaDesde&fechaHasta -> Resumen general
GET    /reportes/movimientos               ?cajaId&monedaId&tipo&fechaDesde&fechaHasta
GET    /reportes/saldos                    -> Saldos de todas las cajas
GET    /reportes/facturas-pendientes       -> Facturas con saldo > 0
GET    /reportes/planilla-mensual          ?mes&anio -> Planilla ejecutada vs presupuestado
```

#### Seguridad (Admin)

```
GET    /admin/usuarios                     -> Listar usuarios del tenant
POST   /admin/usuarios                     { username, password, roles }
PUT    /admin/usuarios/:id                 -> Actualizar
POST   /admin/usuarios/:id/asociar-tenant  { propietarioId }

GET    /admin/roles                        -> Listar roles
POST   /admin/roles                        { nombre, descripcion }
PUT    /admin/roles/:id                    -> Actualizar
POST   /admin/roles/:id/funcionalidades    { funcionalidadIds[] }
```

### 4.3 Estructura de Respuesta Estandar

**Exito:**
```json
{
  "success": true,
  "data": {},
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "message": "OK"
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "El importe debe ser mayor a 0",
    "details": []
  }
}
```

---

## 5. Flujo de Navegacion (UX)

### 5.1 Mapa de Navegacion

```
Login
  |
  +-- Tiene 1 cuenta -> Home directo
  +-- Tiene N cuentas -> Seleccion de Cuenta (tenant)
                          |
                          v
                        Home
                        +-- Resumen de cajas (cards con saldo)
                        |     +-- Click en caja -> Detalle Caja
                        |           +-- Tab movimientos (ingresos + egresos)
                        |           +-- Boton: Nuevo Ingreso
                        |           +-- Boton: Nuevo Egreso
                        |           +-- Boton: Transferir
                        |           +-- Boton: Convertir Moneda
                        |
                        +-- Sidebar / Menu
                        |     +-- Inicio (Home)
                        |     +-- Movimientos
                        |     |     +-- Ingresos
                        |     |     +-- Egresos
                        |     +-- Clientes
                        |     +-- Facturacion
                        |     |     +-- Facturas a Cobrar
                        |     |     +-- Facturas a Pagar
                        |     +-- Planillas
                        |     |     +-- Planilla de Gastos
                        |     |     +-- Planilla de Cobros
                        |     +-- Informes
                        |     +-- Configuracion
                        |           +-- Tipos de Ingreso
                        |           +-- Tipos de Egreso
                        |           +-- Cajas
                        |           +-- Usuarios
                        |           +-- Roles
                        |
                        +-- Acciones rapidas (FAB o header)
                              +-- + Ingreso
                              +-- + Egreso
                              +-- + Transferencia
```

### 5.2 Wireframes (Descripcion)

#### Login
- Card centrada, campo usuario/password, boton "Ingresar"
- Link "Registrar"

#### Seleccion de Cuenta
- Cards con nombre de cada cuenta/tenant
- Si tiene 1 sola, auto-redirigir

#### Home
- Header: nombre de cuenta + avatar + boton cambiar cuenta
- Grid de cards de cajas (nombre, saldo total, badges de monedas)
- Grafico resumen rapido (ingresos vs egresos del mes)
- Acciones rapidas: +Ingreso, +Egreso, Transferir

#### Detalle de Caja
- Header: nombre de caja + saldo por moneda
- Filtros: rango de fechas, tipo (ingreso/egreso), moneda
- Lista de movimientos (timeline: fecha, tipo, concepto, importe +/-)
- FAB: nuevo movimiento

#### Modal Ingreso/Egreso
- Formulario limpio con campos claros
- Selector de tipo (dropdown), fecha (date picker), importe
- Observacion opcional
- Validacion en tiempo real

#### Informes
- Filtros en sidebar: caja, moneda, rango, tipo
- Graficos: torta por tipo, barras por mes, lineas de tendencia
- Tabla exportable

### 5.3 Principios UX

1. **Acciones financieras en max 3 clicks** desde cualquier pantalla
2. **Feedback inmediato**: toast en operaciones exitosas, errores claros
3. **Confirmacion**: dialog antes de eliminar movimientos
4. **Colores semanticos**: verde = ingreso, rojo = egreso, azul = transferencia
5. **Mobile-first**: sidebar colapsable, cards apiladas, FAB flotante
6. **Offline-ready**: service worker para PWA, cola de operaciones pendientes

---

## 6. Estructura de Carpetas

### 6.1 Monorepo

```
wallet/
├── docker-compose.yml
├── .env.example
├── .gitignore
│
├── backend/                          # NestJS API
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   │
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   │
│   │   ├── common/                   # Compartido
│   │   │   ├── decorators/
│   │   │   │   └── tenant.decorator.ts
│   │   │   ├── filters/
│   │   │   │   └── http-exception.filter.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── tenant.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   ├── transform.interceptor.ts
│   │   │   │   └── audit.interceptor.ts
│   │   │   ├── pipes/
│   │   │   │   └── validation.pipe.ts
│   │   │   └── types/
│   │   │       └── index.ts
│   │   │
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   └── jwt.config.ts
│   │   │
│   │   ├── entities/                 # TypeORM entities
│   │   │   ├── propietario.entity.ts
│   │   │   ├── secuser.entity.ts
│   │   │   ├── secuserpropietario.entity.ts
│   │   │   ├── secrole.entity.ts
│   │   │   ├── secuserrole.entity.ts
│   │   │   ├── secfunctionality.entity.ts
│   │   │   ├── secfunctionalityrole.entity.ts
│   │   │   ├── caja.entity.ts
│   │   │   ├── cajadiaria.entity.ts
│   │   │   ├── moneda.entity.ts
│   │   │   ├── cliente.entity.ts
│   │   │   ├── tipoingreso.entity.ts
│   │   │   ├── tipoegreso.entity.ts
│   │   │   ├── ingreso.entity.ts
│   │   │   ├── egreso.entity.ts
│   │   │   ├── transferencia.entity.ts
│   │   │   ├── factura.entity.ts
│   │   │   ├── facturagasto.entity.ts
│   │   │   ├── planillagastos.entity.ts
│   │   │   ├── planillagastosdetalle.entity.ts
│   │   │   ├── planillacobros.entity.ts
│   │   │   ├── planillacobrosdetalle.entity.ts
│   │   │   ├── conversionmoneda.entity.ts
│   │   │   ├── auditoria.entity.ts
│   │   │   └── saldocaja.entity.ts
│   │   │
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.module.ts
│   │   │   │   ├── auth.controller.ts
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── strategies/
│   │   │   │   │   └── jwt.strategy.ts
│   │   │   │   └── dto/
│   │   │   │       ├── login.dto.ts
│   │   │   │       └── register.dto.ts
│   │   │   │
│   │   │   ├── cajas/
│   │   │   │   ├── cajas.module.ts
│   │   │   │   ├── cajas.controller.ts
│   │   │   │   ├── cajas.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-caja.dto.ts
│   │   │   │       └── update-caja.dto.ts
│   │   │   │
│   │   │   ├── ingresos/
│   │   │   │   ├── ingresos.module.ts
│   │   │   │   ├── ingresos.controller.ts
│   │   │   │   ├── ingresos.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-ingreso.dto.ts
│   │   │   │       └── update-ingreso.dto.ts
│   │   │   │
│   │   │   ├── egresos/
│   │   │   │   ├── egresos.module.ts
│   │   │   │   ├── egresos.controller.ts
│   │   │   │   ├── egresos.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-egreso.dto.ts
│   │   │   │       └── update-egreso.dto.ts
│   │   │   │
│   │   │   ├── transferencias/
│   │   │   │   ├── transferencias.module.ts
│   │   │   │   ├── transferencias.controller.ts
│   │   │   │   ├── transferencias.service.ts
│   │   │   │   └── dto/
│   │   │   │       └── create-transferencia.dto.ts
│   │   │   │
│   │   │   ├── conversiones/
│   │   │   │   ├── conversiones.module.ts
│   │   │   │   ├── conversiones.controller.ts
│   │   │   │   ├── conversiones.service.ts
│   │   │   │   └── dto/
│   │   │   │       └── create-conversion.dto.ts
│   │   │   │
│   │   │   ├── facturas/
│   │   │   │   ├── facturas.module.ts
│   │   │   │   ├── facturas.controller.ts
│   │   │   │   ├── facturas.service.ts
│   │   │   │   └── dto/
│   │   │   │       ├── create-factura.dto.ts
│   │   │   │       └── cobrar-factura.dto.ts
│   │   │   │
│   │   │   ├── facturas-gasto/
│   │   │   │   ├── facturas-gasto.module.ts
│   │   │   │   ├── facturas-gasto.controller.ts
│   │   │   │   ├── facturas-gasto.service.ts
│   │   │   │   └── dto/
│   │   │   │       └── create-factura-gasto.dto.ts
│   │   │   │
│   │   │   ├── planillas-gastos/
│   │   │   │   ├── planillas-gastos.module.ts
│   │   │   │   ├── planillas-gastos.controller.ts
│   │   │   │   ├── planillas-gastos.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── planillas-cobros/
│   │   │   │   ├── planillas-cobros.module.ts
│   │   │   │   ├── planillas-cobros.controller.ts
│   │   │   │   ├── planillas-cobros.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── clientes/
│   │   │   │   ├── clientes.module.ts
│   │   │   │   ├── clientes.controller.ts
│   │   │   │   ├── clientes.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── catalogos/
│   │   │   │   ├── catalogos.module.ts
│   │   │   │   ├── tipos-ingreso.controller.ts
│   │   │   │   ├── tipos-egreso.controller.ts
│   │   │   │   ├── catalogos.service.ts
│   │   │   │   └── dto/
│   │   │   │
│   │   │   ├── reportes/
│   │   │   │   ├── reportes.module.ts
│   │   │   │   ├── reportes.controller.ts
│   │   │   │   └── reportes.service.ts
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── admin.module.ts
│   │   │       ├── usuarios.controller.ts
│   │   │       ├── roles.controller.ts
│   │   │       └── admin.service.ts
│   │   │
│   │   └── database/
│   │       └── migrations/           # TypeORM migrations
│   │           ├── 001_expand_pks.ts
│   │           ├── 002_add_soft_delete.ts
│   │           ├── 003_new_tables.ts
│   │           └── 004_add_cajaId_to_movements.ts
│   │
│   └── test/
│       ├── app.e2e-spec.ts
│       └── modules/
│           ├── ingresos.service.spec.ts
│           └── egresos.service.spec.ts
│
├── frontend/                         # React App
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── index.html
│   │
│   ├── public/
│   │   ├── favicon.ico
│   │   └── manifest.json            # PWA
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── vite-env.d.ts
│       │
│       ├── api/                      # Capa de API
│       │   ├── client.ts             # Axios instance + interceptors
│       │   ├── auth.ts
│       │   ├── cajas.ts
│       │   ├── ingresos.ts
│       │   ├── egresos.ts
│       │   ├── transferencias.ts
│       │   ├── conversiones.ts
│       │   ├── facturas.ts
│       │   ├── facturas-gasto.ts
│       │   ├── planillas.ts
│       │   ├── clientes.ts
│       │   ├── catalogos.ts
│       │   └── reportes.ts
│       │
│       ├── components/               # Componentes reutilizables
│       │   ├── ui/
│       │   │   ├── Button.tsx
│       │   │   ├── Input.tsx
│       │   │   ├── Select.tsx
│       │   │   ├── Modal.tsx
│       │   │   ├── Table.tsx
│       │   │   ├── Card.tsx
│       │   │   ├── Badge.tsx
│       │   │   ├── Spinner.tsx
│       │   │   ├── Toast.tsx
│       │   │   └── EmptyState.tsx
│       │   ├── layout/
│       │   │   ├── AppLayout.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   ├── Header.tsx
│       │   │   └── MobileNav.tsx
│       │   └── shared/
│       │       ├── MovementForm.tsx
│       │       ├── MoneyInput.tsx
│       │       ├── CurrencyBadge.tsx
│       │       ├── DateRangePicker.tsx
│       │       └── ConfirmDialog.tsx
│       │
│       ├── hooks/                    # Custom hooks
│       │   ├── useAuth.ts
│       │   ├── useTenant.ts
│       │   ├── useCajas.ts
│       │   ├── useMovimientos.ts
│       │   └── usePagination.ts
│       │
│       ├── pages/                    # Paginas
│       │   ├── Login.tsx
│       │   ├── SelectAccount.tsx
│       │   ├── Home.tsx
│       │   ├── CajaDetalle.tsx
│       │   ├── Ingresos.tsx
│       │   ├── Egresos.tsx
│       │   ├── Clientes.tsx
│       │   ├── Facturas.tsx
│       │   ├── FacturasGasto.tsx
│       │   ├── PlanillaGastos.tsx
│       │   ├── PlanillaCobros.tsx
│       │   ├── Informes.tsx
│       │   └── Configuracion.tsx
│       │
│       ├── store/                    # Estado global (Zustand)
│       │   ├── authStore.ts
│       │   └── tenantStore.ts
│       │
│       ├── types/                    # TypeScript types
│       │   ├── auth.ts
│       │   ├── caja.ts
│       │   ├── movimiento.ts
│       │   ├── factura.ts
│       │   ├── cliente.ts
│       │   └── common.ts
│       │
│       └── utils/
│           ├── format.ts             # Formato de moneda, fechas
│           ├── validation.ts         # Validaciones comunes
│           └── constants.ts          # Constantes del sistema
│
└── docs/                             # Documentacion
    ├── api/                          # OpenAPI spec
    └── migrations/                   # Notas de migracion
```

---

## 7. Buenas Practicas

### 7.1 Seguridad

| Practica | Implementacion |
|---|---|
| **Autenticacion** | JWT con access token (15min) + refresh token (7d) |
| **Passwords** | bcrypt con salt rounds 12 (migrar de base64 actual) |
| **Multitenancy** | Guard global que inyecta `propietarioId` en todas las queries |
| **RBAC** | Roles y funcionalidades existentes en la DB |
| **Validacion** | class-validator en DTOs, Zod en frontend |
| **SQL Injection** | TypeORM con parametros, nunca concatenar SQL |
| **CORS** | Whitelist de dominios permitidos |
| **Rate limiting** | @nestjs/throttler en endpoints de auth |
| **Logs** | Winston: audit de operaciones financieras |
| **HTTPS** | Obligatorio en produccion |

### 7.2 Manejo de Dinero

```typescript
// Backend: siempre DECIMAL
@Column({ type: 'decimal', precision: 18, scale: 2 })
importe: number;

// Backend: usar decimal.js para calculos
import Decimal from 'decimal.js';
const resultado = new Decimal(a).plus(new Decimal(b));

// Frontend: formatear para display
const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'ARS',
  }).format(amount);
```

### 7.3 Transacciones Financieras

```typescript
// Ejemplo: Registrar transferencia
async transferir(dto: CreateTransferenciaDto) {
  return this.dataSource.transaction(async (manager) => {
    const egreso = manager.create(Egreso, {
      importe: dto.importe,
      tipoEgreso: tipoTransferencia,
      cajaId: dto.cajaOrigenId,
      propietarioId: tenantId,
    });
    await manager.save(egreso);

    const ingreso = manager.create(Ingreso, {
      importe: dto.importe,
      tipoIngreso: tipoTransferencia,
      cajaId: dto.cajaDestinoId,
      propietarioId: tenantId,
    });
    await manager.save(ingreso);

    const transferencia = manager.create(Transferencia, {
      origenCajaDiariaId: ...,
      destinoCajaDiariaId: ...,
      importe: dto.importe,
      monedaId: dto.monedaId,
      propietarioId: tenantId,
    });
    await manager.save(transferencia);

    await this.actualizarSaldos(manager, dto.cajaOrigenId, dto.monedaId, -dto.importe);
    await this.actualizarSaldos(manager, dto.cajaDestinoId, dto.monedaId, dto.importe);

    return transferencia;
  });
}
```

### 7.4 Idempotencia

```typescript
// El frontend envia un idempotencyKey en operaciones financieras
// El backend verifica si ya existe un movimiento con esa clave
// Si existe, devuelve el movimiento existente sin crear otro

@Column({ unique: true, nullable: true })
idempotencyKey: string;
```

### 7.5 Multitenancy

```typescript
// Guard que se aplica globalmente a todos los controllers
@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const propietarioId = request.headers['x-tenant-id'] || user.propietarioId;
    request.tenantId = propietarioId;
    return true;
  }
}
```

---

## 8. Escalabilidad Futura

### 8.1 Corto Plazo (3 meses)

- Migracion de PKs de smallint a INT
- Implementacion de saldos cacheados (tabla saldocaja)
- Migracion de passwords a bcrypt
- PWA con service worker para uso offline
- Exportacion de reportes a PDF/Excel

### 8.2 Mediano Plazo (6 meses)

- Notificaciones push (vencimiento de facturas, planillas)
- API de cotizacion de moneda automatica (BCRA / API externa)
- Dashboard con graficos avanzados (Chart.js / Recharts)
- Adjuntar comprobantes/imagenes a movimientos (S3)
- Auditoria completa con diff de cambios

### 8.3 Largo Plazo (12+ meses)

- Integracion con bancos (Open Banking)
- App movil nativa (React Native compartiendo logica)
- Multi-idioma (i18n)
- Multi-tenant con schema isolation o DB separada
- Real-time con WebSockets (movimientos en vivo)
- Machine Learning: categorizacion automatica, deteccion de anomalias
- API publica para integraciones de terceros
- Microservicios: separar auth, wallet, billing en servicios independientes

### 8.4 Escalabilidad Tecnica

| Estrategia | Cuando aplicarla |
|---|---|
| **Read replicas** MySQL | Cuando lecturas de reportes sean lentas |
| **Redis cache** | Cache de saldos, sesiones, cotizaciones |
| **Message queue** (Bull/BullMQ) | Procesamiento async de reportes pesados |
| **CDN** | Assets estaticos del frontend |
| **Containerizacion** (Docker) | Desde el inicio para consistencia |
| **CI/CD** (GitHub Actions) | Desde el inicio para calidad |

---

## 9. Plan de Implementacion

### Fase 1: Infraestructura base (Semana 1-2)
- Setup NestJS + TypeORM conectado a MySQL existente
- Migraciones iniciales (solo ALTER TABLE, no romper datos)
- Auth con JWT (migracion de passwords en login)

### Fase 2: Funcionalidad core (Semana 3-6)
- Modulo de cajas + saldos
- Modulo de ingresos y egresos
- Modulo de transferencias
- Frontend: Login, Home, Detalle Caja

### Fase 3: Funcionalidad extendida (Semana 7-10)
- Facturas a cobrar/pagar
- Planillas de gastos/cobros
- Conversion de moneda
- Clientes y catalogos

### Fase 4: Informes y admin (Semana 11-12)
- Reportes y graficos
- Administracion de usuarios/roles
- PWA y optimizaciones

### Fase 5: Produccion (Semana 13-14)
- Testing E2E
- Deploy con Docker
- Migracion de datos si es necesario
- Monitoreo y logs
