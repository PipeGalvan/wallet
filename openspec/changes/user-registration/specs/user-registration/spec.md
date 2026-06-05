# User Registration Specification

## Purpose

Define el flujo completo de registro de usuarios: desde el formulario frontend hasta la creación de la estructura de datos necesaria en el backend para que el usuario pueda operar inmediatamente tras registrarse.

## Requirements

### Requirement: Backend - Transactional Registration

El endpoint `POST /auth/register` MUST crear en una única transacción TypeORM las siguientes entidades: `SecUser`, `Propietario`, `SecUserPropietario`, una `Caja` default, `TipoIngreso` básicos y `TipoEgreso` básicos. Si cualquier paso falla, MUST hacer rollback de todo.

La respuesta MUST tener el mismo formato que `POST /auth/login`: `{ token, user, cuentas }`.

#### Scenario: Registro exitoso

- GIVEN no existe un usuario con el username "juan"
- WHEN se envía `POST /auth/register` con `{ username: "juan", password: "123456" }`
- THEN se crea un `SecUser` con password hasheado en bcrypt
- AND se crea un `Propietario` con nombre "juan"
- AND se crea un `SecUserPropietario` vinculando ambos
- AND se crea una `Caja` con nombre "Caja Principal", activa, vinculada al propietario
- AND se crean TiposIngreso básicos: "Sueldo", "Venta", "Otro"
- AND se crean TiposEgreso básicos: "Alquiler", "Comida", "Transporte", "Otro"
- AND la respuesta devuelve `{ token, user: { id, username, isAdmin: false }, cuentas: [{ id, nombre }] }`

#### Scenario: Username duplicado

- GIVEN ya existe un usuario con username "juan"
- WHEN se envía `POST /auth/register` con `{ username: "juan", password: "123456" }`
- THEN devuelve HTTP 409 Conflict
- AND el body contiene `{ message: "El nombre de usuario ya existe" }`
- AND no se crea ninguna entidad nueva

#### Scenario: Password muy corta

- GIVEN un username válido
- WHEN se envía `POST /auth/register` con `{ username: "ana", password: "12" }`
- THEN devuelve HTTP 400 Bad Request
- AND no se crea ninguna entidad

### Requirement: Frontend - Registration Page

Debe existir una página en `/register` con un formulario que contenga: username, password, confirmar password. El formulario MUST validar que las passwords coincidan antes de enviar. Tras registro exitoso, MUST autologuearse y redirigir al dashboard.

#### Scenario: Registro exitoso desde frontend

- GIVEN el usuario está en `/register`
- WHEN completa username "maria", password "123456", confirmar password "123456" y envía
- THEN se llama a `POST /auth/register`
- AND se guarda el token y datos en el auth store
- AND se redirige a `/` (dashboard)

#### Scenario: Passwords no coinciden

- GIVEN el usuario está en `/register`
- WHEN completa password "123456" y confirmar password "654321" y envía
- THEN se muestra error "Las contraseñas no coinciden"
- AND NO se envía request al backend

#### Scenario: Username ya existe (error del backend)

- GIVEN el usuario está en `/register`
- WHEN registra con un username que ya existe
- THEN se muestra error "El nombre de usuario ya existe"

### Requirement: Frontend - Login Page Link

La página de login MUST tener un link visible que permita navegar a `/register`.

#### Scenario: Navegación a registro

- GIVEN el usuario está en `/login`
- WHEN hace click en "¿No tenés cuenta? Registrate"
- THEN navega a `/register`

### Requirement: Frontend - Register Page Link

La página de registro MUST tener un link para volver al login.

#### Scenario: Navegación a login desde registro

- GIVEN el usuario está en `/register`
- WHEN hace click en "¿Ya tenés cuenta? Ingresá"
- THEN navega a `/login`
