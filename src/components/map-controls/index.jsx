import MenuBar from '../menu-bar';
import CollapsibleSection from './CollapsibleSection';
import MapSectionContent from './MapSectionContent';
import RoomSectionContent from './RoomSectionContent';
import LayerSectionContent from './LayerSectionContent';
import GenerateSectionContent from './GenerateSectionContent';

import {
  MapControlWrapper,
} from './style.js';
import { EMPTY_SET } from '../map-view/utils';

function MapControls(props) {
  const {
    mapData = [],
    focusX = 0,
    focusY = 0,
    handleControlRoomValue,
    handleControlRoomToggle,
    showGrid = true,
    onToggleGrid,
    showChunks = false,
    onToggleChunks,
    darkMode = true,
    onToggleDarkMode,
    is3DView = false,
    onToggle3DView,
    splitView = false,
    onToggleSplitView,
    cellSize = 40,
    onCellSizeChange,
    mapName = '',
    onMapNameCommit,
    mapCreated,
    mapEdited,
    roomCountActive = 0,
    roomCountTotal = 0,
    linkCountActive = 0,
    linkCountTotal = 0,
    mapKbSize = '0.0',
    onSave,
    onExport,
    isQuillMode = false,
    onNavigate,
    sidebarOpen = false,
    textInputRef,
    selectedCells = EMPTY_SET,
    onNudge,
    elasticNudge = false,
    onToggleElasticNudge,
    onTransform,
    onLayerMove,
    onGenerate,
    mapWidth = 25,
    mapHeight = 25,
    maxMapSize = 100,
    onExtendMap,
    onExitToggle,
    onExitColorChange,
    layers = [],
    focusLayer = 0,
    onLayerChange,
    onLayerAdd,
    onLayerDelete,
    onLayerRename,
    onLayerReorder,
    defaultLayer = 0,
    onDefaultLayerChange,
    tilingMode = 'single',
    onTilingModeChange,
    onCut,
    onCopy,
    onPaste,
    onClear,
    onUndo,
    onRedo,
    canUndo = false,
    canRedo = false,
    theme,
  } = props;

  const room = mapData?.[focusX]?.[focusY] ?? {};

  return (
    <MapControlWrapper $theme={theme} $open={sidebarOpen}>
      <MenuBar
        onSave={onSave}
        onPrint={onExport}
        showGrid={showGrid}
        onToggleGrid={onToggleGrid}
        showChunks={showChunks}
        onToggleChunks={onToggleChunks}
        darkMode={darkMode}
        onToggleDarkMode={onToggleDarkMode}
        is3DView={is3DView}
        onToggle3DView={onToggle3DView}
        splitView={splitView}
        onToggleSplitView={onToggleSplitView}
        cellSize={cellSize}
        onCellSizeChange={onCellSizeChange}
        theme={theme}
        onCut={onCut}
        onCopy={onCopy}
        onPaste={onPaste}
        onClear={onClear}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <CollapsibleSection
        title="Map"
        defaultOpen={true}
        storageKey="sidebar.map"
        theme={theme}
      >
        <MapSectionContent
          mapName={mapName}
          onMapNameCommit={onMapNameCommit}
          mapCreated={mapCreated}
          mapEdited={mapEdited}
          roomCountActive={roomCountActive}
          roomCountTotal={roomCountTotal}
          linkCountActive={linkCountActive}
          linkCountTotal={linkCountTotal}
          mapKbSize={mapKbSize}
          mapWidth={mapWidth}
          mapHeight={mapHeight}
          maxMapSize={maxMapSize}
          onExtendMap={onExtendMap}
          theme={theme}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Selected Room(s)"
        defaultOpen={false}
        storageKey="sidebar.room"
        theme={theme}
      >
        <RoomSectionContent
          room={room}
          focusX={focusX}
          focusY={focusY}
          cellSize={cellSize}
          handleControlRoomValue={handleControlRoomValue}
          handleControlRoomToggle={handleControlRoomToggle}
          onExitToggle={onExitToggle}
          onExitColorChange={onExitColorChange}
          selectedCells={selectedCells}
          onNudge={onNudge}
          elasticNudge={elasticNudge}
          onToggleElasticNudge={onToggleElasticNudge}
          onTransform={onTransform}
          onLayerMove={onLayerMove}
          textInputRef={textInputRef}
          isQuillMode={isQuillMode}
          onNavigate={onNavigate}
          theme={theme}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Generate"
        defaultOpen={false}
        storageKey="sidebar.generate"
        theme={theme}
      >
        <GenerateSectionContent
          selectedCells={selectedCells}
          focusX={focusX}
          focusY={focusY}
          onGenerate={onGenerate}
          theme={theme}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="Layers"
        defaultOpen={false}
        storageKey="sidebar.layers"
        theme={theme}
      >
        <LayerSectionContent
          layers={layers}
          focusLayer={focusLayer}
          defaultLayer={defaultLayer}
          onLayerChange={onLayerChange}
          onLayerAdd={onLayerAdd}
          onLayerDelete={onLayerDelete}
          onLayerRename={onLayerRename}
          onLayerReorder={onLayerReorder}
          onDefaultLayerChange={onDefaultLayerChange}
          tilingMode={tilingMode}
          onTilingModeChange={onTilingModeChange}
          theme={theme}
        />
      </CollapsibleSection>
    </MapControlWrapper>
  );
}

export default MapControls;
