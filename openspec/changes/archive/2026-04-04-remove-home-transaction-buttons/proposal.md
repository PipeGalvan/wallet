## Why

La página Home muestra botones de Ingreso, Egreso y Transferir que no tienen sentido en ese contexto, ya que estas operaciones son exclusivas de cada caja individual. El botón "Transferir" ni siquiera funciona (onClick vacío). Estos botones generan confusión al navegar a páginas genéricas (`/ingresos`, `/egresos`) sin una caja seleccionada, cuando la funcionalidad real y completa ya existe en CajaDetalle.

## What Changes

- **BREAKING**: Se eliminan los 3 botones (Ingreso, Egreso, Transferir) de la página Home.
- Se remueve el `navigate` a `/ingresos?new=true` y `/egresos?new=true` desde el Home.
- Se eliminan las importaciones de iconos (`ArrowDownCircle`, `ArrowUpCircle`, `Repeat`) y el componente `Button` si ya no se usan en Home.

## Capabilities

### New Capabilities

_(Ninguna)_

### Modified Capabilities

_(Ninguna — solo se elimina código de la página Home, sin cambios en requisitos de specs)_

## Impact

- **Frontend**: `frontend/src/pages/Home.tsx` — se eliminan los botones y código asociado.
- **Sin impacto en backend** ni en APIs.
- **Sin impacto en rutas** — las páginas `/ingresos`, `/egresos`, `/transferencias` siguen existiendo y accesibles desde el sidebar.
