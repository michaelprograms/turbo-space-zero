import { useState } from 'react';
import {
  LayerNavStrip,
  LayerNavRow,
  LayerNavInfo,
  LayerNavName,
  LayerNavPosition,
  LayerNavButtons,
  LayerNavButton,
  LayerList,
  LayerListRow,
  LayerListDot,
  LayerListStar,
  LayerListName,
  LayerRenameInput,
  LayerAddButton,
  LayoutToggleRow,
  LayoutToggleLabel,
  LayoutToggleButton,
} from './style.js';

const LAYOUT_MODES = [
  { id: 'single', label: '□', title: 'Single' },
  { id: 'column', label: '▥', title: 'Column' },
  { id: 'row', label: '▤', title: 'Row' },
  { id: 'grid', label: '⊞', title: 'Grid' },
];

function LayerSectionContent({
  layers = [],
  focusLayer = 0,
  defaultLayer = 0,
  onLayerChange,
  onLayerAdd,
  onLayerDelete,
  onLayerRename,
  onLayerReorder,
  onDefaultLayerChange,
  tilingMode = 'single',
  onTilingModeChange,
  theme,
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const activeLayer = layers[focusLayer];

  const startRename = () => {
    if (!activeLayer) return;
    setRenameValue(activeLayer.name);
    setIsRenaming(true);
  };

  const commitRename = () => {
    if (renameValue.trim()) onLayerRename?.(focusLayer, renameValue.trim());
    setIsRenaming(false);
  };

  const cancelRename = () => setIsRenaming(false);

  return (
    <>
      {activeLayer && (
        <LayerNavStrip $theme={theme}>
          <LayerNavRow>
            <LayerNavInfo $theme={theme}>
              {isRenaming ? (
                <LayerRenameInput
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
                <LayerNavName>{activeLayer.name}</LayerNavName>
              )}
            </LayerNavInfo>
            <LayerNavButtons>
              <LayerNavButton
                $theme={theme}
                type="button"
                aria-label="Rename layer"
                onClick={startRename}
              >✎</LayerNavButton>
            </LayerNavButtons>
          </LayerNavRow>
          <LayerNavRow>
            <LayerNavPosition $theme={theme}>
              {focusLayer + 1} / {layers.length}
            </LayerNavPosition>
            <LayerNavButtons>
              <LayerNavButton
                $theme={theme}
                type="button"
                aria-label="Move layer up"
                disabled={focusLayer === 0}
                onClick={() => onLayerReorder?.(focusLayer, focusLayer - 1)}
              >↑</LayerNavButton>
              <LayerNavButton
                $theme={theme}
                type="button"
                aria-label="Move layer down"
                disabled={focusLayer === layers.length - 1}
                onClick={() => onLayerReorder?.(focusLayer, focusLayer + 1)}
              >↓</LayerNavButton>
              <LayerNavButton
                $theme={theme}
                type="button"
                aria-label="Set as default layer"
                onClick={() => onDefaultLayerChange?.(focusLayer)}
              >{focusLayer === defaultLayer ? '★' : '☆'}</LayerNavButton>
              <LayerNavButton
                $theme={theme}
                type="button"
                aria-label="Delete layer"
                disabled={layers.length <= 1}
                onClick={() => onLayerDelete?.(focusLayer)}
              >✕</LayerNavButton>
            </LayerNavButtons>
          </LayerNavRow>
        </LayerNavStrip>
      )}

      <LayerList $theme={theme}>
        {layers.map((layer, i) => (
          <LayerListRow
            key={layer.id ?? i}
            $active={i === focusLayer}
            $theme={theme}
            onClick={() => onLayerChange?.(i)}
          >
            <LayerListDot>{i === focusLayer ? '●' : '○'}</LayerListDot>
            <LayerListStar
              $default={i === defaultLayer}
              $theme={theme}
              title={i === defaultLayer ? 'Default layer' : 'Set as default'}
              onClick={e => {
                e.stopPropagation();
                onDefaultLayerChange?.(i);
              }}
            >{i === defaultLayer ? '★' : '☆'}</LayerListStar>
            <LayerListName>{layer.name}</LayerListName>
          </LayerListRow>
        ))}
      </LayerList>

      <LayerAddButton
        $theme={theme}
        type="button"
        onClick={() => onLayerAdd?.()}
      >＋ Add layer</LayerAddButton>

      <LayoutToggleRow $theme={theme}>
        <LayoutToggleLabel $theme={theme}>Layout</LayoutToggleLabel>
        {LAYOUT_MODES.map(mode => (
          <LayoutToggleButton
            key={mode.id}
            $theme={theme}
            $active={tilingMode === mode.id}
            type="button"
            title={mode.title}
            aria-label={`${mode.title} layout`}
            onClick={() => onTilingModeChange?.(mode.id)}
          >{mode.label}</LayoutToggleButton>
        ))}
      </LayoutToggleRow>
    </>
  );
}

export default LayerSectionContent;
