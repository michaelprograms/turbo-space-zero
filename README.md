# Turbo Space Zero

A browser-based grid map editor for building room-and-exit maps in the MUD / text-adventure style. Draw rooms on a grid, connect them with directional exits, organise them across layers, and view the result in 2D or 3D. Everything runs in the browser; maps persist locally in IndexedDB, with no backend.

## Tech stack

- **React 19** + **Vite 8**
- **Konva** / **react-konva**: 2D canvas rendering
- **react-three-fiber** + **drei** + **three**: 3D view
- **idb-keyval**: IndexedDB persistence
- **styled-components**: co-located `style.js` per component
- **Vitest** + **@testing-library/react**: tests

## Getting started

Requires Node `24.14.1` (see `.nvmrc`).

```bash
nvm use
npm install
npm start        # dev server on http://localhost:3000
```

## Scripts

| Command | Description |
|---|---|
| `npm start` | Dev server (port 3000) |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm test` | Vitest in watch mode |
| `npm run test:update` | Update test snapshots |

## Architecture

### Data layer
- `src/data/index.js`: storage API over `idb-keyval` (custom stores `tsz-maps` / `tsz-settings`) plus map factory and grid-resize helpers.
- A map is a set of named **layers**, each holding a 2D array of room objects. Rooms carry properties like `enabled`, fill/border colors, and directional exits.
- Map CRUD: `getMaps`, `getMap`, `addMap`, `setMap`, `updateMap`, `deleteMap`. Settings: `getSetting` / `setSetting`.

### State
- `src/context`: global app state via React Context; tracks the active map and boots by loading the last-viewed map (or creating a default).

### Components (`src/components`)
- `map-view`: orchestrator that loads the active map, holds map data in local state, and handles keyboard navigation (arrow / numpad), save, and export.
- `map-2d-canvas`: Konva grid with rooms as `<Rect>` and exits as connecting `<Line>`s.
- `map-3d-canvas`: three.js / r3f view of the same map.
- `map-canvas-tiling`: tiling helpers for the canvas.
- `map-controls`: sidebar for toggling rooms / exits and editing border & fill.
- `menu-bar`, `file-menu`, `dialogs`: New / Open / Save / Export PNG and related UI.

### Key patterns
- Data flows: IndexedDB → `map-view` local state → props down to canvas and controls.
- Keyboard navigation uses numpad directions (1–9) and arrow keys; Space toggles a room.
- PNG export via `stageRef.current.toDataURL()`.
- Deployed under base path `/turbo-space-zero/` (see `vite.config.js`).

## Testing

```bash
npm test
```

Vitest runs in a `jsdom` environment (`src/setupTests.js`). Tests are co-located with components (`*.test.jsx`).
