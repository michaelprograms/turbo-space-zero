import { vi, beforeEach } from 'vitest';

export const createMockMapData = () =>
  Array.from({ length: 5 }, () =>
    Array.from({ length: 5 }, () => ({}))
  );

export const mockKonvaStage = { add: vi.fn(), toDataURL: vi.fn(() => ''), destroy: vi.fn() };

vi.mock('konva', () => ({
  default: {
    Stage: vi.fn(function() { return mockKonvaStage; }),
    Layer: vi.fn(function() { return { add: vi.fn() }; }),
    Rect: vi.fn(function() { return {}; }),
    Line: vi.fn(function() { return {}; }),
    Text: vi.fn(function() { return {}; }),
    Circle: vi.fn(function() { return {}; }),
  },
}));

export let mockMapResult = {
  id: 'test-map-id',
  name: 'Test Map',
  width: 5,
  height: 5,
  focusX: 2,
  focusY: 2,
  focusLayer: 0,
  cellSize: 40,
  layers: [{ name: 'Layer 1', data: createMockMapData() }],
};

export let clipboardMock;

beforeEach(() => {
  vi.restoreAllMocks();
  mockMapResult.layers = [{ name: 'Layer 1', data: createMockMapData() }];
  mockMapResult.focusLayer = 0;
  clipboardMock = {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  };
  mockKonvaStage.add.mockReset();
  mockKonvaStage.toDataURL.mockReset();
  mockKonvaStage.destroy.mockReset();

  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
    scale: vi.fn(),
    fillStyle: '',
    fillRect: vi.fn(),
    font: '',
    fillText: vi.fn(),
    drawImage: vi.fn(),
    lineWidth: 1,
    setLineDash: vi.fn(),
    lineDashOffset: 0,
    strokeStyle: '',
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  });
  vi.spyOn(window, 'open').mockReturnValue(null);
});

vi.mock('../../context', () => ({
  useAppContext: () => ({ activeMapId: 'test-map-id' }),
}));

vi.mock('../map-2d-canvas', () => ({
  default: ({ focusX, focusY, layers, focusLayer, selectedCells, onCellClick, scrollRef }) => {
    const mapData = layers?.[focusLayer ?? 0]?.data ?? [];
    return (
      <div
        ref={scrollRef}
        data-testid="map-canvas"
        data-focus-x={focusX}
        data-focus-y={focusY}
        data-focus-layer={focusLayer}
        data-layers={layers?.length}
        data-map-data={JSON.stringify(mapData)}
        data-selected-cells={JSON.stringify([...(selectedCells ?? [])])}
      >
        <button data-testid="cell-1-1" onClick={(e) => onCellClick?.(1, 1, { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey })} />
        <button data-testid="cell-0-0" onClick={(e) => onCellClick?.(0, 0, { shiftKey: e.shiftKey, ctrlKey: e.ctrlKey, altKey: e.altKey })} />
      </div>
    );
  },
}));

vi.mock('../map-controls', () => ({
  default: ({ mapName, onMapNameChange, onMapNameBlur, isQuillMode, sidebarOpen, textInputRef, selectedCells, onNudge, handleControlRoomValue, onExtendMap, mapWidth, mapHeight, onExitToggle, onLayerDelete, onSave, canUndo, canRedo, onUndo, onRedo, onExitColorChange }) => (
    <div
      data-sidebar-open={String(sidebarOpen)}
      data-selected-cells={JSON.stringify([...(selectedCells ?? [])])}
      data-map-width={mapWidth}
      data-map-height={mapHeight}
      data-can-undo={String(canUndo ?? false)}
      data-can-redo={String(canRedo ?? false)}
    >
      <input
        data-testid="map-name-input"
        value={mapName}
        onChange={(e) => onMapNameChange?.(e.target.value)}
        onBlur={onMapNameBlur}
      />
      <input data-testid="room-text-input" ref={textInputRef} defaultValue="" />
      <button data-testid="nudge-north" onClick={() => onNudge?.('north')} />
      <button data-testid="set-fill-color" onClick={() => handleControlRoomValue?.('fillColor', '#ff0000')} />
      <button data-testid="extend-add-north" onClick={() => onExtendMap?.('north', 'add')} />
      <button data-testid="extend-remove-south" onClick={() => onExtendMap?.('south', 'remove')} />
      <button data-testid="extend-add-west" onClick={() => onExtendMap?.('west', 'add')} />
      <button data-testid="toggle-up-exit" onClick={() => onExitToggle?.('up')} />
      <button data-testid="delete-layer-0" onClick={() => onLayerDelete?.(0)} />
      <button data-testid="save-btn" onClick={onSave} />
      <button data-testid="set-north-exit-color" onClick={() => onExitColorChange?.('north', '#ff0000')} />
      <button data-testid="reset-north-exit-color" onClick={() => onExitColorChange?.('north', '#666666')} />
    </div>
  ),
}));

vi.mock('../../data', () => ({
  getMap: vi.fn(() => Promise.resolve(mockMapResult)),
  setMap: vi.fn().mockResolvedValue(undefined),
  updateMap: vi.fn().mockResolvedValue(undefined),
  addMap: vi.fn().mockResolvedValue('new-map-id'),
  MAX_MAP_SIZE: 100,
  SCHEMA_VERSION: 1,
  appendCol: (data, width, height) => ({ data: [...data.map(col => [...col]), Array.from({ length: height }, () => ({}))] , width: width + 1, height }),
  prependCol: (data, width, height) => ({ data: [Array.from({ length: height }, () => ({})), ...data.map(col => [...col])], width: width + 1, height }),
  appendRow: (data, width, height) => ({ data: data.map(col => [...col, {}]), width, height: height + 1 }),
  prependRow: (data, width, height) => ({ data: data.map(col => [{}, ...col]), width, height: height + 1 }),
  deleteRightCol: (data, width, height) => ({ data: data.slice(0, width - 1).map(col => [...col]), width: width - 1, height }),
  deleteLeftCol: (data, width, height) => ({ data: data.slice(1).map(col => [...col]), width: width - 1, height }),
  deleteBottomRow: (data, width, height) => ({ data: data.map(col => col.slice(0, height - 1)), width, height: height - 1 }),
  deleteTopRow: (data, width, height) => ({ data: data.map(col => col.slice(1)), width, height: height - 1 }),
}));

export const makeLayer = (data) => ({ name: 'L', data });
export const makeGrid = (w, h) => Array.from({ length: w }, () => Array.from({ length: h }, () => ({})));
