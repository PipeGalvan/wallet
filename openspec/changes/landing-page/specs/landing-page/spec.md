# Landing Page Specification

## Purpose

Define el comportamiento de la página pública de presentación de Wallet: qué se muestra, cómo responde según el estado de autenticación, y cómo se navega hacia registro y login.

## Requirements

### Requirement: Public Landing Page

El sistema MUST mostrar una página landing en la ruta `/` para usuarios no autenticados. La página MUST contener: navbar con links a login y registro, hero section con título y CTA, sección de features (6 cards), CTA final de registro, y footer. La página MUST soportar dark mode.

#### Scenario: Usuario no autenticado entra a la raíz

- GIVEN el usuario no tiene token válido
- WHEN navega a `/`
- THEN se muestra la landing page completa (navbar, hero, features, CTA, footer)

#### Scenario: Usuario no autenticado hace click en "Empezar ahora"

- GIVEN el usuario está en la landing `/`
- WHEN hace click en el CTA "Empezar ahora"
- THEN navega a `/register`

#### Scenario: Usuario no autenticado hace click en "Ingresar"

- GIVEN el usuario está en la landing `/`
- WHEN hace click en el link "Ingresar" del navbar
- THEN navega a `/login`

### Requirement: Authenticated Redirect

El sistema MUST redirigir automáticamente al dashboard a cualquier usuario autenticado que intente acceder a `/`.

#### Scenario: Usuario logueado entra a la raíz

- GIVEN el usuario tiene token válido y tenant seleccionado
- WHEN navega a `/`
- THEN redirige automáticamente a `/app` (dashboard)

#### Scenario: Usuario logueado sin tenant seleccionado

- GIVEN el usuario tiene token válido pero no tiene tenantId
- WHEN navega a `/`
- THEN redirige a `/select-account`

### Requirement: Dashboard Route Change

La ruta del dashboard MUST cambiar de `/` a `/app`. Todos los links internos del sidebar MUST apuntar a `/app`.

#### Scenario: Sidebar link "Inicio" después del cambio

- GIVEN el usuario está logueado y en el sidebar
- WHEN hace click en "Inicio"
- THEN navega a `/app` (no a `/`)

### Requirement: Responsive Design

La landing MUST ser responsive: 1 columna en mobile, 2 en tablet, 3 en desktop para el grid de features. El hero MUST adaptarse a cualquier tamaño de pantalla.

#### Scenario: Visualización en mobile

- GIVEN la pantalla tiene ancho menor a 640px
- WHEN se muestra la landing
- THEN el grid de features muestra 1 columna
- AND el hero se muestra en layout vertical

### Requirement: Dark Mode Support

La landing MUST soportar dark mode usando la misma clase `dark` que el resto de la app.

#### Scenario: Toggle dark mode desde la landing

- GIVEN el usuario activa dark mode (toggle del sistema o preferencia guardada)
- WHEN se muestra la landing
- THEN todos los elementos adaptan sus colores al tema oscuro
