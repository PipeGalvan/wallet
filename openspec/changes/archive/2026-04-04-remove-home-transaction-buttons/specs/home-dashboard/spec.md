## REMOVED Requirements

### Requirement: Home transaction action buttons
**Reason**: Los botones de Ingreso, Egreso y Transferir son exclusivos de cada caja. En la página Home operan sin contexto de caja, generando confusión. La funcionalidad completa existe en CajaDetalle.
**Migration**: El usuario debe seleccionar una caja específica y usar los botones dentro de CajaDetalle para realizar transacciones.

#### Scenario: Home page no muestra botones de transacción
- **WHEN** el usuario visita la página Home
- **THEN** la página NO muestra botones de Ingreso, Egreso ni Transferir
- **AND** solo muestra el listado de cajas con sus saldos

#### Scenario: Navegación desde sidebar permanece disponible
- **WHEN** el usuario quiere registrar un ingreso o egreso genérico
- **THEN** puede usar las opciones del sidebar (Ingresos, Egresos, Transferencias) para acceder a las páginas de listado correspondientes
