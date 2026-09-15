import { useState } from 'react';
import { getEffectiveKeys } from '../map-view/utils';
import {
  MapControlLabel,
  MapControlSlider,
  SliderLabelRow,
  MapControlTextInput,
  MapSelectionCount,
  GenerateSeedRow,
  GenerateButton,
  ResizeHeader,
  LayoutToggleLabel,
  LayoutToggleButton,
} from './style.js';

const randomSeed = () => Math.floor(Math.random() * 1e9);

// Overwrites the current selection (or the focused cell if nothing is
// marquee-selected) with either a meandering Path or a connected Maze.
function GenerateSectionContent({ selectedCells, focusX, focusY, onGenerate, theme }) {
  const [pattern, setPattern] = useState('path');
  const [density, setDensity] = useState(0.7);
  const [curviness, setCurviness] = useState(0.5);
  const [seed, setSeed] = useState(randomSeed);

  const areaSize = getEffectiveKeys(selectedCells, focusX, focusY).length;

  const handleGenerate = () => onGenerate?.({ pattern, density, curviness, seed });

  return (
    <>
      <MapSelectionCount $theme={theme}>
        {areaSize} cell{areaSize === 1 ? '' : 's'} selected
      </MapSelectionCount>

      <ResizeHeader $theme={theme}>
        <LayoutToggleLabel $theme={theme}>Pattern</LayoutToggleLabel>
        <LayoutToggleButton
          $theme={theme} $active={pattern === 'path'} type="button"
          onClick={() => setPattern('path')}
        >PATH</LayoutToggleButton>
        <LayoutToggleButton
          $theme={theme} $active={pattern === 'maze'} type="button"
          onClick={() => setPattern('maze')}
        >MAZE</LayoutToggleButton>
      </ResizeHeader>

      {pattern === 'maze' && (
        <MapControlLabel $theme={theme}>
          Density — {Math.round(density * 100)}%
          <MapControlSlider
            type="range" min={0.1} max={1} step={0.05} value={density}
            onChange={e => setDensity(Number(e.target.value))}
            style={{ accentColor: theme?.accentColor || '#106ba3' }}
          />
          <SliderLabelRow $theme={theme}><span>Sparse</span><span>Dense</span></SliderLabelRow>
        </MapControlLabel>
      )}

      <MapControlLabel $theme={theme}>
        Curviness — {Math.round(curviness * 100)}%
        <MapControlSlider
          type="range" min={0} max={1} step={0.05} value={curviness}
          onChange={e => setCurviness(Number(e.target.value))}
          style={{ accentColor: theme?.accentColor || '#106ba3' }}
        />
        <SliderLabelRow $theme={theme}><span>Straight</span><span>Winding</span></SliderLabelRow>
      </MapControlLabel>

      <MapControlLabel $theme={theme}>
        Seed
        <GenerateSeedRow $theme={theme}>
          <MapControlTextInput
            $theme={theme} type="number" value={seed}
            onChange={e => setSeed(Number(e.target.value))}
            onKeyDown={e => e.stopPropagation()}
          />
          <button type="button" aria-label="Random seed" onClick={() => setSeed(randomSeed())}>🎲</button>
        </GenerateSeedRow>
      </MapControlLabel>

      <GenerateButton $theme={theme} type="button" disabled={areaSize === 0} onClick={handleGenerate}>
        Generate rooms
      </GenerateButton>
    </>
  );
}

export default GenerateSectionContent;
