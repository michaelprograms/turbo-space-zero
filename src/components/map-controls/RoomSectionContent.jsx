import SliderWithLabels from './SliderWithLabels';
import { DIRECTION_GRID } from './constants';
import {
  MapButtonGroupExits,
  MapControlButtonExit,
  MapRoomSymbol,
  MapControlColorLabel,
  MapControlFormGroup,
  MapControlLabel,
  MapControlTextInput,
  ClearBgButton,
  MapSelectionCount,
  NudgeCenterPlaceholder,
  ResizeHeader,
  LayoutToggleLabel,
} from './style.js';
import { ToggleRow, ToggleLabel, ToggleSwitch } from '../menu-bar/style.js';
import ColorPill from './ColorPill';
import { EMPTY_SET } from '../map-view/utils';
import { getMaxBorderWidth } from '../map-2d-canvas/geometry.js';
import { ROOM_DEFAULTS, EXIT_DEFAULT_COLOR } from '../../constants/room';

// ponytail: default paint for an unset Cell Background pill; land/water are just presets.
const CELL_BG_DEFAULT = '#bfe3ff';

function RoomSectionContent({
  room = {},
  focusX = 0,
  focusY = 0,
  cellSize = 40,
  handleControlRoomValue,
  handleControlRoomToggle,
  onExitToggle,
  onExitColorChange,
  selectedCells = EMPTY_SET,
  onNudge,
  elasticNudge = false,
  onToggleElasticNudge,
  onTransform,
  onLayerMove,
  textInputRef,
  isQuillMode = false,
  onNavigate,
  theme,
}) {
  const enabled      = room.enabled ?? false;
  const roomSize     = room.roomSize ?? ROOM_DEFAULTS.roomSize;
  const borderRadius = room.borderRadius ?? ROOM_DEFAULTS.borderRadius;
  const borderWidth  = room.borderWidth ?? ROOM_DEFAULTS.borderWidth;
  const borderColor  = room.borderColor ?? ROOM_DEFAULTS.borderColor;
  const fillColor    = room.fillColor ?? ROOM_DEFAULTS.fillColor;
  const roomText     = room.text ?? '';

  const selectedCount = selectedCells.size;

  // Border width tops out relative to room/cell size; ~4 evenly spaced labels.
  const maxBorderWidth = getMaxBorderWidth(cellSize, roomSize);
  const borderLabelStep = Math.max(1, Math.round(maxBorderWidth / 4));
  // At width 0 there's no stroke, so the Border Color picker does nothing.
  const borderColorDisabled = !enabled || borderWidth === 0;

  return (
    <>
      {selectedCount <= 1 && (
        <MapSelectionCount $theme={theme}>
          Selected cell: ({focusX}, {focusY})
        </MapSelectionCount>
      )}

      <ResizeHeader $theme={theme}>
        <LayoutToggleLabel $theme={theme}>Exit Links</LayoutToggleLabel>
      </ResizeHeader>

      {/* Exit controls: 3×3 grid + Up/spacer/Down column */}
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginBottom: '10px' }}>
        <MapButtonGroupExits $quillActive={isQuillMode} data-testid="exits-grid" style={{ margin: 0 }}>
          {DIRECTION_GRID.map((btn) => {
            if (btn === null) {
              return (
                <MapControlButtonExit
                  key="center"
                  $active={room?.enabled}
                  $theme={theme}
                  type="button"
                  aria-label="Toggle room"
                  onClick={() => handleControlRoomToggle('enabled')}
                >
                  <MapRoomSymbol
                    $fillColor={room?.fillColor}
                    $borderColor={room?.borderColor}
                    $borderRadius={room?.borderRadius}
                    $borderWidth={room?.borderWidth}
                  />
                </MapControlButtonExit>
              );
            }
            return (
              <MapControlButtonExit
                key={btn.dir}
                $active={!isQuillMode && (room.exits?.[btn.dir] ?? false)}
                $theme={theme}
                type="button"
                aria-label={btn.label}
                onClick={() =>
                  isQuillMode ? onNavigate?.(btn.dir) : onExitToggle?.(btn.dir)
                }
              >
                {btn.label}
                {!isQuillMode && (
                  <ColorPill
                    size="mini"
                    theme={theme}
                    data-testid={`${btn.dir}-exit-color`}
                    aria-label={`${btn.label} exit color`}
                    value={room.exitColors?.[btn.dir] ?? EXIT_DEFAULT_COLOR}
                    onChange={(c) => onExitColorChange?.(btn.dir, c)}
                    onPick={() => { if (!(room.exits?.[btn.dir])) onExitToggle?.(btn.dir); }}
                  />
                )}
              </MapControlButtonExit>
            );
          })}
        </MapButtonGroupExits>

        {/* Up / spacer / Down column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <MapControlButtonExit
            $active={room.exits?.up ?? false}
            $theme={theme}
            type="button"
            aria-label="Up exit"
            onClick={() => onExitToggle?.('up')}
          >
            ▲
            {!isQuillMode && (
              <ColorPill
                size="mini"
                theme={theme}
                data-testid="up-exit-color"
                aria-label="Up exit color"
                value={room.exitColors?.up ?? EXIT_DEFAULT_COLOR}
                onChange={(c) => onExitColorChange?.('up', c)}
                onPick={() => { if (!(room.exits?.up)) onExitToggle?.('up'); }}
              />
            )}
          </MapControlButtonExit>
          <div style={{ width: '38px', height: '38px' }} />
          <MapControlButtonExit
            $active={room.exits?.down ?? false}
            $theme={theme}
            type="button"
            aria-label="Down exit"
            onClick={() => onExitToggle?.('down')}
          >
            ▼
            {!isQuillMode && (
              <ColorPill
                size="mini"
                theme={theme}
                data-testid="down-exit-color"
                aria-label="Down exit color"
                value={room.exitColors?.down ?? EXIT_DEFAULT_COLOR}
                onChange={(c) => onExitColorChange?.('down', c)}
                onPick={() => { if (!(room.exits?.down)) onExitToggle?.('down'); }}
              />
            )}
          </MapControlButtonExit>
        </div>
      </div>

      <MapControlTextInput
        $theme={theme}
        ref={textInputRef}
        type="text"
        value={roomText}
        placeholder="Room label"
        onChange={(e) => handleControlRoomValue('text', e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') e.target.blur(); }}
      />

      <MapControlFormGroup>
        <MapControlLabel $theme={theme}>
          Room Size
          <SliderWithLabels
            min={12}
            max={38}
            step={1}
            labelStep={13}
            value={roomSize}
            onChange={(e) => handleControlRoomValue('roomSize', Number(e.target.value))}
            disabled={!enabled}
            theme={theme}
          />
        </MapControlLabel>
        <MapControlLabel $theme={theme}>
          Border Width
          <SliderWithLabels
            min={0}
            max={maxBorderWidth}
            step={1}
            labelStep={borderLabelStep}
            value={Math.min(borderWidth, maxBorderWidth)}
            onChange={(e) => handleControlRoomValue('borderWidth', Number(e.target.value))}
            disabled={!enabled}
            theme={theme}
          />
        </MapControlLabel>
        <MapControlLabel $theme={theme}>
          Border Radius
          <SliderWithLabels
            min={0}
            max={50}
            step={1}
            labelStep={10}
            value={borderRadius}
            onChange={(e) => handleControlRoomValue('borderRadius', Number(e.target.value))}
            disabled={!enabled}
            theme={theme}
          />
        </MapControlLabel>
        <MapControlColorLabel $theme={theme} $disabled={borderColorDisabled}>
          Border Color
          <ColorPill
            showHex
            theme={theme}
            value={borderColor}
            disabled={borderColorDisabled}
            onChange={(c) => handleControlRoomValue('borderColor', c)}
          />
        </MapControlColorLabel>
        <MapControlColorLabel $theme={theme} $disabled={!enabled}>
          Fill Color
          <ColorPill
            showHex
            theme={theme}
            value={fillColor}
            disabled={!enabled}
            onChange={(c) => handleControlRoomValue('fillColor', c)}
          />
        </MapControlColorLabel>
        <MapControlColorLabel $theme={theme}>
          Cell Background
          <span style={{ display: 'flex', alignItems: 'center' }}>
            {room.bg && (
              <ClearBgButton
                $theme={theme}
                type="button"
                aria-label="Clear cell background"
                onClick={() => handleControlRoomValue('bg', undefined)}
              >
                Clear
              </ClearBgButton>
            )}
            <ColorPill
              showHex
              theme={theme}
              aria-label="Cell background color"
              value={room.bg ?? CELL_BG_DEFAULT}
              onChange={(c) => handleControlRoomValue('bg', c)}
            />
          </span>
        </MapControlColorLabel>
      </MapControlFormGroup>

      {selectedCount > 1 && (
        <MapSelectionCount $theme={theme}>
          {selectedCount} rooms selected
        </MapSelectionCount>
      )}

      <ResizeHeader $theme={theme}>
        <LayoutToggleLabel $theme={theme}>Nudge Selection</LayoutToggleLabel>
      </ResizeHeader>

      <ToggleRow $theme={theme}>
        <ToggleLabel $theme={theme} title="Re-point exits to stationary neighbors as the selection moves">Elastic</ToggleLabel>
        <ToggleSwitch
          $on={elasticNudge}
          $theme={theme}
          onClick={onToggleElasticNudge}
          role="switch"
          aria-checked={elasticNudge}
          aria-label="Elastic nudge"
        />
      </ToggleRow>

      {/* Nudge 3×3 grid + a layer up/down column, aligned like the Exit Links section */}
      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
        <MapButtonGroupExits data-testid="nudge-grid" style={{ margin: 0 }}>
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
                onClick={() => onNudge?.(btn.dir)}
              >
                {btn.label}
              </MapControlButtonExit>
            );
          })}
        </MapButtonGroupExits>

        {/* Move selection up / down a layer — top row aligns with NE, bottom with SE */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <MapControlButtonExit
            $theme={theme}
            type="button"
            aria-label="Move selection up a layer"
            title="Move selection up a layer"
            onClick={() => onLayerMove?.(1)}
          >
            ▲
          </MapControlButtonExit>
          <div style={{ width: '38px', height: '38px' }} />
          <MapControlButtonExit
            $theme={theme}
            type="button"
            aria-label="Move selection down a layer"
            title="Move selection down a layer"
            onClick={() => onLayerMove?.(-1)}
          >
            ▼
          </MapControlButtonExit>
        </div>
      </div>

      <ResizeHeader $theme={theme}>
        <LayoutToggleLabel $theme={theme}>Transform Selection</LayoutToggleLabel>
      </ResizeHeader>

      <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }} data-testid="transform-row">
        {[
          { op: 'rotateCCW', label: '⟲', title: 'Rotate 90° counter-clockwise' },
          { op: 'rotateCW', label: '⟳', title: 'Rotate 90° clockwise' },
          { op: 'flipH', label: '⇋', title: 'Flip horizontally' },
          { op: 'flipV', label: '⇅', title: 'Flip vertically' },
        ].map(({ op, label, title }) => (
          <MapControlButtonExit
            key={op}
            $theme={theme}
            type="button"
            aria-label={title}
            title={title}
            onClick={() => onTransform?.(op)}
          >
            {label}
          </MapControlButtonExit>
        ))}
      </div>
    </>
  );
}

export default RoomSectionContent;
