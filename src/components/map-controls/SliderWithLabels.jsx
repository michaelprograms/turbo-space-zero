import { useMemo } from 'react';
import { MapControlSlider, SliderLabelRow } from './style.js';

function computeLabels(min, max, labelStep) {
  const labels = [];
  for (let i = 0; min + i * labelStep <= max; i++) {
    labels.push(min + i * labelStep);
  }
  if (labels[labels.length - 1] !== max) {
    labels.push(max);
  }
  return labels;
}

function SliderWithLabels({ min, max, step, labelStep, value, onChange, disabled, theme }) {
  const labels = useMemo(() => computeLabels(min, max, labelStep), [min, max, labelStep]);

  return (
    <>
      <MapControlSlider
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        disabled={disabled}
        $theme={theme}
      />
      <SliderLabelRow $disabled={disabled} $theme={theme}>
        {labels.map(v => <span key={v}>{v}</span>)}
      </SliderLabelRow>
    </>
  );
}

export default SliderWithLabels;
