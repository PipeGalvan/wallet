## Context

La página Home (`frontend/src/pages/Home.tsx`) muestra un dashboard con el listado de cajas y sus saldos. Actualmente incluye 3 botones de acción rápida: Ingreso, Egreso y Transferir. Estos botones navegan a páginas genéricas sin contexto de caja, y el de Transferir no funciona. La funcionalidad completa ya existe en CajaDetalle (`frontend/src/pages/CajaDetalle.tsx`) con modales dedicados.

## Goals / Non-Goals

**Goals:**
- Eliminar los botones Ingreso, Egreso y Transferir de la página Home.
- Limpiar imports e imports de iconos que queden sin uso en Home.tsx.

**Non-Goals:**
- No modificar la página CajaDetalle ni sus modales.
- No alterar las rutas `/ingresos`, `/egresos`, `/transferencias`.
- No cambiar el sidebar ni otras navegaciones.

## Decisions

1. **Eliminar solo los botones y su contenedor flex** — Se remueve el `<div className="flex gap-2 flex-wrap">` completo con los 3 botones. No se agrega nada en su reemplazo.
2. **Limpiar imports muertos** — Se remueven `ArrowDownCircle`, `ArrowUpCircle`, `Repeat` de lucide-react si no se usan en otra parte del archivo. Se remueve `useNavigate` si ya no hay navegación programática en Home.

## Risks / Trade-offs

- **[Menor] Pérdida de acceso rápido]** → Los usuarios que usaban estos botones deben ir a una caja específica. Esto es intencional ya que las operaciones son por caja.
