import Map2DCanvas from '../map-2d-canvas';
import { TilingGrid, TileWrapper, TileLabel } from './style.js';

function getGridColumns(tilingMode, layerCount) {
  switch (tilingMode) {
    case 'column': return '1fr';
    case 'row': return `repeat(${layerCount}, 1fr)`;
    case 'grid': return `repeat(${Math.ceil(Math.sqrt(layerCount))}, 1fr)`;
    default: return '1fr';
  }
}

function MapCanvasTiling({
  tilingMode = 'single',
  layers = [],
  focusLayer = 0,
  focusX = 0,
  focusY = 0,
  onCellClick,
  onLayerChange,
  stageRef,
  scrollRef,
  cellSize = 40,
  showGrid = true,
  showChunks = false,
  theme = {},
  selectedCells,
}) {
  if (tilingMode === 'single') {
    return (
      <Map2DCanvas
        layers={layers}
        focusLayer={focusLayer}
        focusX={focusX}
        focusY={focusY}
        onCellClick={onCellClick}
        stageRef={stageRef}
        scrollRef={scrollRef}
        cellSize={cellSize}
        showGrid={showGrid}
        showChunks={showChunks}
        theme={theme}
        selectedCells={selectedCells}
      />
    );
  }

  const columns = getGridColumns(tilingMode, layers.length);

  return (
    <TilingGrid $theme={theme} $columns={columns}>
      {layers.map((layer, i) => (
        <TileWrapper
          key={layer.id ?? i}
          $focused={i === focusLayer}
          $theme={theme}
        >
          <TileLabel $theme={theme}>{layer.name}</TileLabel>
          <Map2DCanvas
            layers={layers}
            focusLayer={focusLayer}
            layerIndex={i}
            disableGhosts={true}
            focusX={i === focusLayer ? focusX : -1}
            focusY={i === focusLayer ? focusY : -1}
            onCellClick={(x, y, mods) => {
              if (i !== focusLayer) onLayerChange?.(i);
              onCellClick?.(x, y, mods);
            }}
            cellSize={cellSize}
            showGrid={showGrid}
            showChunks={showChunks}
            theme={theme}
            selectedCells={i === focusLayer ? selectedCells : new Set()}
          />
        </TileWrapper>
      ))}
    </TilingGrid>
  );
}

export default MapCanvasTiling;
