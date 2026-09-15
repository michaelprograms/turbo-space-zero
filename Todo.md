# Todo

## New
- Standardize exit color picker and fill/stroke color pickers to be more alike?
- Rename Quill mode to Write or Edit mode? Quill feels out of place now

## Bugs

- Quill mode: moving off a disabled-room cell enables it (likely by-design — quill draws a corridor as you move; needs a design call before touching)
- Transparency stacks per room element — center point darker when no room node; should apply once to whole cell (ghost layers only; fix is Konva group .cache())
- Horizontal Exits tutorial looks weird. it adds exits in the neighboring rooms without moving focus, which isn't possible unless you're in Quill mode or selecting each room cell and adding exits

## Quick Wins

_(empty)_

## Backlog

- Notes: map-level and room-level text fields (room label exists; longer notes + map-level notes do not)
- Layer opacity viewthrough — ghost layers use progressively more opacity
- Layer tiling: move to View menu, add NxN grid option, sync scroll across tiles
- 3D view: black frame box around layer area (extend to edge of exit reach)
- Row/column ops: insert and delete at an arbitrary index (edge add/remove already exists)
- Exit styles: door, dashed, and directional arrow variants (up/down arrows already exist)
- Data model: adapt to Mudlet-style x/y/z coordinates
- Scroll viewport: sidebar and map canvas
- Random room generator (walk a configurable path)
- Check out what Mobile layout exists