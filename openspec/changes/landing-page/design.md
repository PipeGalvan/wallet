# Design: Landing Page

## Technical Approach

Nueva página `Landing.tsx` como ruta pública en `/`. El dashboard actual se mueve a `/app` mediante cambio en `App.tsx`. Se agrega redirección en `/` para usuarios autenticados. Sin cambios en backend.

## Architecture Decisions

### Decision: Dashboard a /app en vez de /home

**Choice**: Mover dashboard a `/app`, landing queda en `/`
**Alternatives**: Landing en `/home`, dashboard en `/dashboard`, usar subdominio
**Rationale**: `/` es la URL natural para una landing. `/app` es corta y semántica para la app本身. El usuario autenticado no nota el cambio porque redirige automáticamente.

### Decision: Landing como componente autocontenido

**Choice**: Un solo componente `Landing.tsx` con todas las secciones inline, sin subcomponentes
**Alternatives**: Componentes separados (Hero, Features, Footer)
**Rationale**: Es una sola página estática sin lógica compleja. Separar en 4 archivos es overengineering. Si crece, se extrae después. YAGNI.

### Decision: Features data como constante local

**Choice**: Array de objetos con icono, título y descripción directamente en el componente
**Alternatives**: JSON externo, CMS, API endpoint
**Rationale**: Son 6 features fijas. No cambian dinámicamente. Hardcodear es lo correcto.

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/pages/Landing.tsx` | Create | Landing page completa |
| `frontend/src/App.tsx` | Modify | `/` → Landing, `/app` → AppLayout, redirect si autenticado |
| `frontend/src/components/layout/Sidebar.tsx` | Modify | "Inicio" apunta a `/app` |

## Sections Structure

```
Navbar: fixed top, transparent sobre hero, blurea al scrollear
Hero: full-viewport, gradiente primary-700→primary-900, texto blanco
Features: bg white/dark:gray-800, grid responsive 1/2/3 col
CTA: gradiente invertido, texto claro
Footer: bg gray-900, texto gray-400
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Manual | Landing visible para no autenticado | Navegar a `/` sin token |
| Manual | Redirect a `/app` si autenticado | Navegar a `/` con token |
| Manual | Links CTAs funcionan | Click en "Empezar ahora" e "Ingresar" |
| Manual | Responsive | DevTools mobile/tablet/desktop |
| Manual | Dark mode | Toggle y verificar colores |

## Migration / Rollout

No migration required. Si el usuario tiene bookmarks a `/`, la landing carga normalmente con link a login. Sin breaking changes.
