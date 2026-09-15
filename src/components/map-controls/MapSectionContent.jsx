import { useState } from 'react';
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
  roomCountActive = 0,
  roomCountTotal = 0,
  linkCountActive = 0,
  linkCountTotal = 0,
  mapKbSize = '0.0',
  mapWidth = 25,
  mapHeight = 25,
  maxMapSize = 100,
  onExtendMap,
  theme,
}) {
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
        <MapMetaValue $theme={theme}>{roomCountActive} active · {roomCountTotal} total</MapMetaValue>
        <MapMetaLabel $theme={theme}>Links</MapMetaLabel>
        <MapMetaValue $theme={theme}>{linkCountActive} active · {linkCountTotal} total</MapMetaValue>
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
