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

function Slider({ theme, label, value, onChange, min, max, step = 1, left, right }) {
  return (
    <MapControlLabel $theme={theme}>
      {label}
      <MapControlSlider
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ accentColor: theme?.accentColor || '#106ba3' }}
      />
      <SliderLabelRow $theme={theme}><span>{left}</span><span>{right}</span></SliderLabelRow>
    </MapControlLabel>
  );
}

const pct = (v) => `${Math.round(v * 100)}%`;

// Overwrites the current selection (or the focused cell if nothing is
// marquee-selected) with a winding Path, a lattice Maze, or a Voronoi Web.
function GenerateSectionContent({ selectedCells, focusX, focusY, onGenerate, theme }) {
  const [pattern, setPattern] = useState('path');
  const [curviness, setCurviness] = useState(0.5);
  const [branches, setBranches] = useState(2);
  const [mazeSpacing, setMazeSpacing] = useState(2);
  const [branching, setBranching] = useState(0.5);
  const [loops, setLoops] = useState(0.1);
  const [diagonals, setDiagonals] = useState(false);
  const [webSpacing, setWebSpacing] = useState(6);
  const [seed, setSeed] = useState(randomSeed);

  const areaSize = getEffectiveKeys(selectedCells, focusX, focusY).length;

  const handleGenerate = () => onGenerate?.({
    pattern,
    seed,
    ...{
      path: { curviness, branches },
      maze: { spacing: mazeSpacing, branching, loops, diagonals },
      web: { spacing: webSpacing },
    }[pattern],
  });

  return (
    <>
      <MapSelectionCount $theme={theme}>
        {areaSize} cell{areaSize === 1 ? '' : 's'} selected
      </MapSelectionCount>

      <ResizeHeader $theme={theme}>
        <LayoutToggleLabel $theme={theme}>Pattern</LayoutToggleLabel>
        {['path', 'maze', 'web'].map(p => (
          <LayoutToggleButton
            key={p} $theme={theme} $active={pattern === p} type="button"
            onClick={() => setPattern(p)}
          >{p.toUpperCase()}</LayoutToggleButton>
        ))}
      </ResizeHeader>

      {pattern === 'path' && (
        <>
          <Slider theme={theme} label={`Curviness — ${pct(curviness)}`} value={curviness} onChange={setCurviness}
            min={0} max={1} step={0.05} left="Straight" right="Winding" />
          <Slider theme={theme} label={`Branches — ${branches}`} value={branches} onChange={setBranches}
            min={0} max={10} left="None" right="Many" />
        </>
      )}

      {pattern === 'maze' && (
        <>
          <Slider theme={theme} label={`Spacing — ${mazeSpacing}`} value={mazeSpacing} onChange={setMazeSpacing}
            min={1} max={8} left="Packed" right="Open" />
          <Slider theme={theme} label={`Branching — ${pct(branching)}`} value={branching} onChange={setBranching}
            min={0} max={1} step={0.05} left="Corridors" right="Bushy" />
          <Slider theme={theme} label={`Loops — ${pct(loops)}`} value={loops} onChange={setLoops}
            min={0} max={1} step={0.05} left="Dead ends" right="Many loops" />
          <ResizeHeader $theme={theme}>
            <LayoutToggleLabel $theme={theme}>Diagonals</LayoutToggleLabel>
            <LayoutToggleButton $theme={theme} $active={!diagonals} type="button" onClick={() => setDiagonals(false)}>OFF</LayoutToggleButton>
            <LayoutToggleButton $theme={theme} $active={diagonals} type="button" onClick={() => setDiagonals(true)}>ON</LayoutToggleButton>
          </ResizeHeader>
        </>
      )}

      {pattern === 'web' && (
        <Slider theme={theme} label={`Spacing — ${webSpacing}`} value={webSpacing} onChange={setWebSpacing}
          min={3} max={20} left="Tight" right="Open" />
      )}

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
