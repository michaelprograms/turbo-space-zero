import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import SliderWithLabels from './SliderWithLabels';

test('renders a slider input', () => {
  render(
    <SliderWithLabels min={0} max={50} step={1} labelStep={10} value={25} onChange={() => {}} />
  );
  expect(screen.getByRole('slider')).toBeInTheDocument();
});

test('renders labels at each labelStep interval', () => {
  render(
    <SliderWithLabels min={0} max={50} step={1} labelStep={10} value={25} onChange={() => {}} />
  );
  ['0', '10', '20', '30', '40', '50'].forEach(label => {
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

test('always includes max as the last label even when max is not a multiple of labelStep from min', () => {
  render(
    <SliderWithLabels min={12} max={38} step={1} labelStep={13} value={12} onChange={() => {}} />
  );
  expect(screen.getByText('12')).toBeInTheDocument();
  expect(screen.getByText('25')).toBeInTheDocument();
  expect(screen.getByText('38')).toBeInTheDocument();
});

test('does not duplicate max when it lands exactly on a labelStep boundary', () => {
  render(
    <SliderWithLabels min={0} max={50} step={1} labelStep={10} value={0} onChange={() => {}} />
  );
  const fifties = screen.getAllByText('50');
  expect(fifties).toHaveLength(1);
});

test('passes disabled to the slider input', () => {
  render(
    <SliderWithLabels min={0} max={50} step={1} labelStep={10} value={0} onChange={() => {}} disabled />
  );
  expect(screen.getByRole('slider')).toBeDisabled();
});

test('slider has correct min, max, and step attributes', () => {
  render(
    <SliderWithLabels min={1} max={10} step={1} labelStep={1} value={5} onChange={() => {}} />
  );
  const slider = screen.getByRole('slider');
  expect(slider).toHaveAttribute('min', '1');
  expect(slider).toHaveAttribute('max', '10');
  expect(slider).toHaveAttribute('step', '1');
});

test('calls onChange when slider value changes', () => {
  const handleChange = vi.fn();
  render(
    <SliderWithLabels min={0} max={50} step={1} labelStep={10} value={25} onChange={handleChange} />
  );
  fireEvent.change(screen.getByRole('slider'), { target: { value: '30' } });
  expect(handleChange).toHaveBeenCalledTimes(1);
});

test('slider reflects the provided value', () => {
  render(
    <SliderWithLabels min={0} max={100} step={5} labelStep={25} value={75} onChange={() => {}} />
  );
  expect(screen.getByRole('slider')).toHaveValue('75');
});
