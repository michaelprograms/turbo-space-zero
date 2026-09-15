# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Dev server:** `npm start` (runs on port 3000)
- **Build:** `npm run build`
- **Test (watch):** `npm test`
- **Test (update snapshots):** `npm run test:update`
- **Preview build:** `npm run preview`

Node version: 24.14.1 (see `.nvmrc`)

## Architecture

Turbo Space Zero is a browser-based grid map editor for building room-and-exit maps (think MUD/text-adventure style). Built with React 19, Vite, Konva (2D canvas), and react-three-fiber/three (3D view).

### Data Layer
- **idb-keyval (IndexedDB)** for client-side persistence; no backend
- `src/data/index.js`: storage API over custom stores `tsz-maps` / `tsz-settings`, plus the map factory and grid-resize helpers
- Map CRUD: `getMaps`, `getMap`, `addMap`, `setMap`, `updateMap`, `deleteMap`. Settings: `getSetting` / `setSetting`
- A map is a set of named **layers**; each layer holds a 2D array of room objects. Rooms carry properties like `enabled`, `fillColor`, `borderColor`, and `exits` / `exitColors`

### State & Context
- `src/context/index.jsx`: global state via React Context; tracks the active map, boots by loading the last-viewed map or creating a default
- Reads are plain `async` calls into the `src/data` API (no reactive query layer)

### Component Structure
- `App.jsx`: shell, waits for context to be ready
- `map-view`: main orchestrator that loads the active map, manages map data in local state, and handles keyboard navigation (arrow/numpad), save/export
- `map-2d-canvas`: Konva `<Stage>` rendering the grid; rooms drawn as `<Rect>` with exit `<Line>` connections
- `map-3d-canvas`: three.js / react-three-fiber view of the same map
- `map-canvas-tiling`: tiling helpers for the canvas
- `map-controls`: sidebar panel for toggling room enabled/exits and adjusting border/fill properties
- `menu-bar`, `file-menu`, `dialogs`: New/Load/Save/Export PNG and related UI

### Styling
- `styled-components`: each component has a co-located `style.js` file
- `modern-normalize` for base reset

### Key Patterns
- Map data flows: IndexedDB → local state in MapView → passed as props to the canvases and MapControls
- Keyboard navigation uses numpad directions (1-9) and arrow keys; Space toggles room enabled
- Export generates a PNG via `stageRef.current.toDataURL()`
- Base path is `/turbo-space-zero/` (configured in `vite.config.js`)
