import { useState, useEffect, useMemo } from 'react';
import { estimateMapKbSize, countEnabledRooms, countExitLinks, countCellBackgrounds } from '../map-view/utils';
import { DIRECTION_GRID } from './constants';
import {
  MapButtonGroupExits,
  MapControlButtonExit,
  NudgeCenterPlaceholder,
  MapNameStrip,
  MapNameDisplay,
  MapNameEditInput,
  MapNameButton,
  MapMetaTable,
  MapMetaLabel,
  MapMetaValue,
  ResizeHeader,
  LayoutToggleLabel,
  LayoutToggleButton,
} from './style.js';

const EDGE_DIRECTION_AXES = {
  north:     { x: false, y: true  },
  south:     { x: false, y: true  },
  east:      { x: true,  y: false },
  west:      { x: true,  y: false },
  northeast: { x: true,  y: true  },
  northwest: { x: true,  y: true  },
  southeast: { x: true,  y: true  },
  southwest: { x: true,  y: true  },
};

// Serializing a big map to measure it takes tens of ms (≈36 ms on 150×150×10),
// so re-measure only once edits pause.
const KB_DEBOUNCE_MS = 500;

function formatDate(ts) {
  return new Date(ts).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function MapSectionContent({
  mapName = '',
  onMapNameCommit,
  mapCreated,
  mapEdited,
  mapData = [],
  layers = [],
  mapWidth = 25,
  mapHeight = 25,
  maxMapSize = 100,
  onExtendMap,
  theme,
}) {
  // This component only exists while the Map section is expanded, so a collapsed
  // section never measures. Measured once on open, then after edits settle.
  const [kb, setKb] = useState(() => ({ layers, size: estimateMapKbSize(layers) }));
  useEffect(() => {
    if (kb.layers === layers) return;
    const t = setTimeout(() => setKb({ layers, size: estimateMapKbSize(layers) }), KB_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [layers, kb.layers]);
  const mapKbSize = kb.size;

  // Counts also only run while the section is open (≈9 ms per edit on big maps).
  const counts = useMemo(() => {
    const total = (count) => layers.reduce((sum, layer) => sum + count(layer.data ?? []), 0);
    return {
      rooms: [countEnabledRooms(mapData), total(countEnabledRooms)],
      links: [countExitLinks(mapData), total(countExitLinks)],
      bgs: [countCellBackgrounds(mapData), total(countCellBackgrounds)],
    };
  }, [mapData, layers]);

  const [extendMode, setExtendMode] = useState('add');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const startRename = () => {
    setRenameValue(mapName);
    setIsRenaming(true);
  };

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed) onMapNameCommit?.(trimmed);
    setIsRenaming(false);
  };

  const cancelRename = () => setIsRenaming(false);

  const isEdgeButtonDisabled = (dir) => {
    const { x, y } = EDGE_DIRECTION_AXES[dir];
    if (extendMode === 'add') {
      return (x && mapWidth >= maxMapSize) || (y && mapHeight >= maxMapSize);
    }
    return (x && mapWidth <= 1) || (y && mapHeight <= 1);
  };

  return (
    <>
      <MapNameStrip $theme={theme}>
        {isRenaming ? (
          <MapNameEditInput
            $theme={theme}
            autoFocus
            value={renameValue}
            onChange={e => setRenameValue(e.target.value)}
            onBlur={cancelRename}
            onKeyDown={e => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') cancelRename();
              e.stopPropagation();
            }}
          />
        ) : (
          <MapNameDisplay $theme={theme}>{mapName}</MapNameDisplay>
        )}
        <MapNameButton
          $theme={theme}
          type="button"
          aria-label="Rename map"
          onMouseDown={e => e.preventDefault()}
          onClick={startRename}
        >✎</MapNameButton>
      </MapNameStrip>

      <MapMetaTable $theme={theme}>
        <MapMetaLabel $theme={theme}>Created</MapMetaLabel>
        <MapMetaValue $theme={theme}>{mapCreated ? formatDate(mapCreated) : '—'}</MapMetaValue>
        <MapMetaLabel $theme={theme}>Edited</MapMetaLabel>
        <MapMetaValue $theme={theme}>{mapEdited ? formatDate(mapEdited) : '—'}</MapMetaValue>
        <MapMetaLabel $theme={theme}>Rooms</MapMetaLabel>
        <MapMetaValue $theme={theme}>{counts.rooms[0]} active · {counts.rooms[1]} total</MapMetaValue>
        <MapMetaLabel $theme={theme}>Links</MapMetaLabel>
        <MapMetaValue $theme={theme}>{counts.links[0]} active · {counts.links[1]} total</MapMetaValue>
        <MapMetaLabel $theme={theme}>Backgrounds</MapMetaLabel>
        <MapMetaValue $theme={theme}>{counts.bgs[0]} active · {counts.bgs[1]} total</MapMetaValue>
        <MapMetaLabel $theme={theme}>Size</MapMetaLabel>
        <MapMetaValue $theme={theme}>{mapWidth} × {mapHeight} · ~{mapKbSize} kb</MapMetaValue>
      </MapMetaTable>

      <ResizeHeader $theme={theme}>
        <LayoutToggleLabel $theme={theme}>Resize Map</LayoutToggleLabel>
        <LayoutToggleButton
          $theme={theme}
          $active={extendMode === 'add'}
          type="button"
          onClick={() => setExtendMode('add')}
        >ADD</LayoutToggleButton>
        <LayoutToggleButton
          $theme={theme}
          $active={extendMode === 'remove'}
          type="button"
          onClick={() => setExtendMode('remove')}
        >REMOVE</LayoutToggleButton>
      </ResizeHeader>

      <MapButtonGroupExits data-testid="edge-grid">
        {DIRECTION_GRID.map((btn) => {
          if (btn === null) {
            return <NudgeCenterPlaceholder key="center" />;
          }
          return (
            <MapControlButtonExit
              key={btn.dir}
              $theme={theme}
              type="button"
              aria-label={btn.label}
              disabled={isEdgeButtonDisabled(btn.dir)}
              onClick={() => onExtendMap?.(btn.dir, extendMode)}
            >
              {btn.label}
            </MapControlButtonExit>
          );
        })}
      </MapButtonGroupExits>

      {/* TODO(roadmap): default-room editor. Intentional placeholder. */}
    </>
  );
}

export default MapSectionContent;
