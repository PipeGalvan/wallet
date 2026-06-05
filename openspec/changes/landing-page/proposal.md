## Why

Cuando un usuario nuevo entra a la app, ve directamente el formulario de login. No hay contexto sobre qué es Wallet, qué puede hacer, ni por qué debería registrarse. Una landing page profesional sirve como "fachada" de la casa: genera confianza, explica el valor y guía al usuario a registrarse.

## What Changes

- **Nueva página Landing** en la ruta `/` (pública, sin autenticación). Contiene: Hero con título y CTA, sección de features con cards, CTA final de registro, footer con link a login.
- **Routing**: El dashboard actual se mueve de `/` a `/app`. La ruta `/` pasa a ser la landing (pública). Si el usuario ya está logueado y entra a `/`, redirige a `/app`.
- **Sin cambios en backend**. Es 100% frontend.

## Capabilities

### New Capabilities

- `landing-page`: Página pública de presentación que muestra las funcionalidades de Wallet y conduce al registro.

### Modified Capabilities

_(Ninguna)_

## Layout propuesto

```
┌─────────────────────────────────────────────┐
│  🏠 Navbar: [Wallet logo]    [Ingresar] [Registrate] │
├─────────────────────────────────────────────┤
│                                             │
│            Hero Section                     │
│     "Tu dinero, bajo control"              │
│  "Gestioná ingresos, egresos, cajas,       │
│   facturas y más. Simple y gratis."        │
│                                             │
│     [Empezar ahora → /register]            │
│                                             │
├─────────────────────────────────────────────┤
│         Features Section (grid 3 col)       │
│                                             │
│  💰 Cajas        📥 Ingresos    📤 Egresos │
│  "Múltiples      "Registrá     "Controlá   │
│   cajas por       tus           tus gastos  │
│   moneda"         ingresos"      por mes"   │
│                                             │
│  🔄 Transferir   📋 Facturas   📊 Informes │
│  "Mové dinero     "Gestioná     "Resumen    │
│   entre cajas"    cobros y      mensual de  │
│                   pagos"        tu dinero"  │
│                                             │
├─────────────────────────────────────────────┤
│           CTA Final                         │
│   "¿Listo para tomar el control?"           │
│   [Creá tu cuenta gratis → /register]      │
│                                             │
├─────────────────────────────────────────────┤
│  Footer: Wallet © 2026 | [Ingresar]        │
└─────────────────────────────────────────────┘
```

## Features a mostrar en cards

| Feature | Icono (lucide) | Descripción corta |
|---------|----------------|-------------------|
| Cajas múltiples | Wallet | Manejá cajas en pesos y dólares con saldos en tiempo real |
| Control de ingresos | ArrowDownCircle | Registrá y categorizá todos tus ingresos |
| Control de egresos | ArrowUpCircle | Seguí tus gastos por categoría y período |
| Transferencias | ArrowRightLeft | Mové dinero entre cajas de forma simple |
| Gastos/Cobros recurrentes | Repeat | Automatizá tus cobros y gastos mensuales |
| Informes | BarChart3 | Visualizá resúmenes mensuales con gráficos |

## Paleta y estética

- Colores: mismos de la app (primary-600/700 azul, emerald para ingresos, red para egresos)
- Fondo hero: gradiente sutil primary-600 → primary-800 (oscuro, impactante)
- Cards features: blancas con bordes suaves (mismo Card component)
- Responsive: 1 col en mobile, 2 en tablet, 3 en desktop
- Dark mode: soporte completo con clase `dark` (mismo toggle que el resto de la app)

## Impact

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/pages/Landing.tsx` | New | Página landing completa |
| `frontend/src/App.tsx` | Modified | `/` → Landing, `/app` → AppLayout |
| `frontend/src/components/layout/Sidebar.tsx` | Modified | Link "Inicio" apunta a `/app` en vez de `/` |
| `frontend/src/pages/Home.tsx` | Modified | Sin cambios (sigue siendo el dashboard) |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Usuario logueado entra a `/` y ve landing | Med | Redirigir a `/app` si hay token |
| Confusión entre `/` y `/app` | Low | Redirección automática, usuario no nota el cambio |

## Rollback Plan

Revertir cambios en App.tsx (volver a `/` como privado) y eliminar Landing.tsx.

## Dependencies

- Ninguna dependencia externa nueva. Solo Tailwind + lucide-react (ya instalados).

## Success Criteria

- [ ] Usuario no logueado ve la landing al entrar a `/`
- [ ] Usuario logueado es redirigido directo al dashboard
- [ ] Los CTAs llevan a /register y /login correctamente
- [ ] Responsive: se ve bien en mobile, tablet y desktop
- [ ] La landing muestra las 6 features principales con íconos
