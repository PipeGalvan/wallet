# Session Management Specification

## Purpose

Definir el comportamiento de la sesión con refresh tokens rotativos transportados por cookie httpOnly: renovación del access token, rotación obligatoria, detección de reúso por familia, binding de scope multitenant, interceptor single-flight en el frontend, logout y restauración de sesión al boot.

## Requirements

### Requirement: Refresh de access token con rotación obligatoria

`POST /auth/refresh` (throttle estricto propio) MUST leer el refresh desde la cookie, hashearlo sha256 y buscar la fila activa. Si NO está revocada, MUST marcarla `revoked=true`, insertar un refresh nuevo en el MISMO `familyId`, emitir un access de 15m con el mismo scope y setear cookie nueva.

#### Scenario: Refresh exitoso rota el token y emite nuevo access

- GIVEN el cliente tiene una cookie de refresh válida y activa
- WHEN envía `POST /auth/refresh`
- THEN la fila vieja queda `revoked=true`
- AND se inserta un nuevo refresh en el mismo `familyId`
- AND la respuesta incluye un access token nuevo de 15m
- AND se setea una nueva cookie de refresh

#### Scenario: Cookie ausente o token expirado

- GIVEN el cliente NO envía cookie de refresh o la fila tiene `ExpiresAt` < now
- WHEN envía `POST /auth/refresh`
- THEN devuelve HTTP 401
- AND NO se setea cookie nueva
- AND el frontend MUST hacer logout

### Requirement: Detección de reúso por familia (family kill)

Si el refresh presentado corresponde a una fila ya `revoked=true`, el sistema MUST interpretarlo como robo: revocar TODAS las filas del mismo `familyId`, limpiar la cookie y devolver HTTP 401. El frontend MUST forzar logout. Una rotación normal NO MUST revocar la familia entera.

#### Scenario: Reúso de token ya rotado revoca toda la familia

- GIVEN un refresh fue rotado y marcado `revoked=true` en un refresh anterior
- WHEN ese token viejo se vuelve a presentar a `POST /auth/refresh`
- THEN TODAS las filas del mismo `familyId` quedan `revoked=true`
- AND la cookie se limpia y devuelve HTTP 401
- AND el frontend hace logout

#### Scenario: Rotación normal NO mata la familia

- GIVEN una rotación exitosa acaba de emitir un token nuevo
- WHEN el token NUEVO (activo) se presenta al siguiente refresh
- THEN el refresh procede normalmente (no family kill)
- AND solo el token presentado queda revocado

### Requirement: Binding de scope leído desde la DB

El refresh MUST leer `propietarioId` EXCLUSIVAMENTE de la fila en `refreshtoken`, nunca del cliente. Si es `NULL`, el access MUST ser user-scope; si está seteado, MUST ser tenant-scope con ese `propietarioId`. Un refresh user-scope NO MUST producir un access tenant-scope y viceversa.

#### Scenario: Refresh tenant-scope produce access tenant-scope

- GIVEN la fila de refresh tiene `PropietarioId=5`
- WHEN se hace `POST /auth/refresh` exitosamente
- THEN el access emitido contiene `propietarioId: 5` (tenant-scope)
- AND el refresh rotado preserva `PropietarioId=5`

#### Scenario: Refresh user-scope NO produce access tenant-scope

- GIVEN la fila de refresh tiene `PropietarioId=NULL`
- WHEN se hace `POST /auth/refresh` exitosamente
- THEN el access emitido NO contiene `propietarioId` (user-scope)
- AND el refresh rotado preserva `PropietarioId=NULL`

### Requirement: selectAccount preserva y rota el refresh al nuevo scope

`selectAccount(propietarioId)` MUST validar la relación user↔propietario con el `sub` del access token (no input del cliente), emitir access tenant-scope, Y rotar el refresh a una fila nueva tenant-scope. El refresh anterior MUST quedar revocado.

#### Scenario: Switch de cuenta rota refresh a tenant-scope

- GIVEN el usuario logueado (user-scope) selecciona un propietario válido para su `sub`
- WHEN llama `selectAccount`
- THEN emite access tenant-scope con ese `propietarioId`
- AND rota el refresh: nueva fila tenant-scope, fila vieja user-scope revocada
- AND el Header account switcher sigue funcionando

#### Scenario: Relación user↔propietario inválida bloqueada

- GIVEN el usuario intenta `selectAccount` con un `propietarioId` no vinculado a su `sub`
- WHEN llama `selectAccount`
- THEN devuelve HTTP 403
- AND NO se rota ningún refresh ni cambia el scope

### Requirement: Interceptor frontend single-flight de refresh

El interceptor de Axios MUST garantizar que ante múltiples 401 concurrentes se dispare EXACTAMENTE un único `POST /auth/refresh` (single-flight vía promesa compartida). Los requests fallidos MUST esperar al refresh y reintentar con el nuevo Bearer. `/auth/refresh` y `/auth/login` MUST cortocircuitarse. Si el refresh falla con 401, el interceptor MUST hacer logout y redirigir.

#### Scenario: Múltiples 401 concurrentes disparan un solo refresh

- GIVEN múltiples requests en vuelo reciben 401 simultáneamente
- WHEN el interceptor procesa los errores
- THEN se ejecuta EXACTAMENTE un único `POST /auth/refresh`
- AND los demás 401 esperan al mismo refresh y reintentan con el nuevo access

#### Scenario: Fallo del refresh fuerza logout sin loop

- GIVEN un request recibe 401 y el interceptor dispara `POST /auth/refresh`
- WHEN el refresh también devuelve 401
- THEN el interceptor hace logout y redirige a `/login`
- AND no queda en loop de reintentos

#### Scenario: Requests a /auth/refresh y /auth/login cortocircuitados

- GIVEN un request a `/auth/refresh` o `/auth/login` recibe 401
- WHEN el interceptor procesa el error
- THEN NO dispara un nuevo refresh

### Requirement: Logout revoca la familia y limpia la cookie

`POST /auth/logout` MUST revocar todas las filas del `familyId` del refresh actual, limpiar la cookie y el frontend MUST limpiar el auth store.

#### Scenario: Logout exitoso

- GIVEN el usuario está logueado con una sesión activa
- WHEN envía `POST /auth/logout`
- THEN todas las filas del `familyId` actual quedan `revoked=true`
- AND la cookie de refresh se elimina y el frontend limpia el auth store

### Requirement: Transporte del refresh en cookie httpOnly

La cookie de refresh MUST ser `httpOnly`, `Secure` (prod), `SameSite=Lax`, `path=/api/v1/auth`, no legible por JS. El access token NO MUST almacenarse en cookie ni localStorage; vive solo en memoria (Zustand sin persistir el token).

#### Scenario: Cookie de refresh con flags correctos

- GIVEN el backend setea la cookie de refresh
- WHEN el navegador la recibe
- THEN tiene `httpOnly`, `secure` (prod), `sameSite=Lax`, `path=/api/v1/auth`
- AND NO es accesible vía `document.cookie`

#### Scenario: Access token fuera de cookie y localStorage

- GIVEN el frontend guarda el access token tras login/refresh
- WHEN se inspecciona el storage del navegador
- THEN el access token NO está en cookie ni en localStorage
- AND solo vive en memoria (Zustand partialize excluye el token)

### Requirement: Restauración de sesión al boot

Al iniciar la app, si hay cookie de refresh pero el access está ausente o expirado, el frontend MUST intentar `POST /auth/refresh` antes de renderizar rutas protegidas. Si falla, MUST tratar al usuario como no autenticado y redirigir a login sin error.

#### Scenario: Boot con cookie válida restaura la sesión

- GIVEN el usuario abre la app con cookie de refresh válida pero sin access token
- WHEN la app bootea
- THEN se llama a `POST /auth/refresh`
- AND con éxito se restauran user, cuentas, tenant y access en memoria

#### Scenario: Boot sin cookie o con refresh inválido

- GIVEN el usuario abre la app sin cookie o el refresh devuelve 401
- WHEN la app bootea
- THEN el usuario queda como no autenticado
- AND redirige a `/login` sin mostrar error
