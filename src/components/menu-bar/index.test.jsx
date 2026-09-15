import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import MenuBar from './index';

const { mockNavigateToMap } = vi.hoisted(() => ({
  mockNavigateToMap: vi.fn(),
}));

vi.mock('../dialogs/OpenMapDialog', () => ({
  default: ({ onClose }) => <div data-testid="open-map-dialog"><button onClick={onClose}>close</button></div>,
}));

vi.mock('../dialogs/AboutDialog', () => ({
  default: ({ onClose }) => <div data-testid="about-dialog"><button onClick={onClose}>close</button></div>,
}));

vi.mock('../dialogs/ShortcutsDialog', () => ({
  default: ({ onClose }) => <div data-testid="shortcuts-dialog"><button onClick={onClose}>close</button></div>,
}));

vi.mock('../dialogs/TutorialDialog', () => ({
  default: ({ onClose }) => <div data-testid="tutorial-dialog"><button onClick={onClose}>close</button></div>,
}));

vi.mock('../../context', () => ({
  useAppContext: () => ({ navigateToMap: mockNavigateToMap, activeMapId: 'test-map-id' }),
}));

vi.mock('../../data/index.js', () => ({
  getMap: vi.fn(),
  addMap: vi.fn(),
  createBlankMap: vi.fn(() => ({
    name: 'Untitled Map',
    focusX: 0,
    focusY: 0,
    focusLayer: 0,
    width: 25,
    height: 25,
    cellSize: 40,
    darkMode: true,
    showGrid: true,
    created: 0,
    edited: 0,
    layers: [],
  })),
}));

beforeEach(() => vi.clearAllMocks());

const defaultProps = {
  onPrint: vi.fn(),
  showGrid: true,
  onToggleGrid: vi.fn(),
  darkMode: true,
  onToggleDarkMode: vi.fn(),
  cellSize: 40,
  onCellSizeChange: vi.fn(),
  theme: null,
};

test('renders four tabs: TSZ, File, Edit, View', () => {
  render(<MenuBar {...defaultProps} />);
  expect(screen.getByRole('button', { name: 'TSZ' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'File' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument();
});

test('no dropdown is visible by default', () => {
  render(<MenuBar {...defaultProps} />);
  expect(screen.queryByText('New')).not.toBeInTheDocument();
  expect(screen.queryByText('About')).not.toBeInTheDocument();
  expect(screen.queryByText('Undo')).not.toBeInTheDocument();
  expect(screen.queryByRole('slider')).not.toBeInTheDocument();
});

test('clicking TSZ tab shows TSZ menu items', async () => {
  const user = userEvent.setup();
  render(<MenuBar {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: 'TSZ' }));
  expect(screen.getByText('About')).toBeInTheDocument();
  expect(screen.getByText('Shortcuts')).toBeInTheDocument();
  expect(screen.getByText('Tutorial')).toBeInTheDocument();
});

test('clicking File tab shows File menu items', async () => {
  const user = userEvent.setup();
  render(<MenuBar {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: 'File' }));
  expect(screen.getByText('New')).toBeInTheDocument();
  expect(screen.getByText('Open')).toBeInTheDocument();
  expect(screen.getByText('Import')).toBeInTheDocument();
  expect(screen.getByText('Export')).toBeInTheDocument();
  expect(screen.getByText('Print')).toBeInTheDocument();
});

test('File menu shows correct shortcut hints: S for Save, P for Print, none for New/Open', async () => {
  const user = userEvent.setup();
  render(<MenuBar {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: 'File' }));

  expect(screen.queryByText('⌘N')).not.toBeInTheDocument();
  expect(screen.queryByText('⌘O')).not.toBeInTheDocument();
  expect(screen.queryByText('⌘S')).not.toBeInTheDocument();
  expect(screen.queryByText('⌘P')).not.toBeInTheDocument();

  expect(screen.getByText('S')).toBeInTheDocument();
  expect(screen.getByText('P')).toBeInTheDocument();
});

test('clicking Edit tab shows all Edit menu items', async () => {
  const user = userEvent.setup();
  render(<MenuBar {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  expect(screen.getByText('Undo')).toBeInTheDocument();
  expect(screen.getByText('Redo')).toBeInTheDocument();
  expect(screen.getByText('Cut')).toBeInTheDocument();
  expect(screen.getByText('Copy')).toBeInTheDocument();
  expect(screen.getByText('Paste')).toBeInTheDocument();
  expect(screen.getByText('Clear')).toBeInTheDocument();
});

test('clicking View tab shows View controls including a zoom slider', async () => {
  const user = userEvent.setup();
  render(<MenuBar {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: 'View' }));
  expect(screen.getByText('Toggle Grid')).toBeInTheDocument();
  expect(screen.getByText('Dark Mode')).toBeInTheDocument();
  expect(screen.getByText('Zoom')).toBeInTheDocument();
  expect(screen.getByRole('slider')).toBeInTheDocument();
});

test('clicking the open tab again closes the dropdown', async () => {
  const user = userEvent.setup();
  render(<MenuBar {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: 'File' }));
  expect(screen.getByText('New')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'File' }));
  expect(screen.queryByText('New')).not.toBeInTheDocument();
});

test('clicking a different tab switches the open menu', async () => {
  const user = userEvent.setup();
  render(<MenuBar {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: 'File' }));
  expect(screen.getByText('New')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  expect(screen.queryByText('New')).not.toBeInTheDocument();
  expect(screen.getByText('Undo')).toBeInTheDocument();
});

test('clicking Print calls onPrint and closes the dropdown', async () => {
  const user = userEvent.setup();
  const onPrint = vi.fn();
  render(<MenuBar {...defaultProps} onPrint={onPrint} />);
  await user.click(screen.getByRole('button', { name: 'File' }));
  await user.click(screen.getByText('Print'));
  expect(onPrint).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Print')).not.toBeInTheDocument();
});

test('clicking Toggle Grid switch calls onToggleGrid', async () => {
  const user = userEvent.setup();
  const onToggleGrid = vi.fn();
  render(<MenuBar {...defaultProps} onToggleGrid={onToggleGrid} />);
  await user.click(screen.getByRole('button', { name: 'View' }));
  await user.click(screen.getByRole('switch', { name: 'Toggle Grid' }));
  expect(onToggleGrid).toHaveBeenCalledTimes(1);
});

test('clicking Dark Mode switch calls onToggleDarkMode', async () => {
  const user = userEvent.setup();
  const onToggleDarkMode = vi.fn();
  render(<MenuBar {...defaultProps} onToggleDarkMode={onToggleDarkMode} />);
  await user.click(screen.getByRole('button', { name: 'View' }));
  await user.click(screen.getByRole('switch', { name: 'Dark Mode' }));
  expect(onToggleDarkMode).toHaveBeenCalledTimes(1);
});

test('View dropdown stays open after interacting with a toggle', async () => {
  const user = userEvent.setup();
  render(<MenuBar {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: 'View' }));
  await user.click(screen.getByRole('switch', { name: 'Toggle Grid' }));
  expect(screen.getByText('Toggle Grid')).toBeInTheDocument();
});

test('zoom slider reflects the cellSize prop', async () => {
  const user = userEvent.setup();
  render(<MenuBar {...defaultProps} cellSize={60} />);
  await user.click(screen.getByRole('button', { name: 'View' }));
  expect(screen.getByRole('slider')).toHaveValue('60');
});

test('clicking Export calls getMap with the active map id', async () => {
  const user = userEvent.setup();
  const { getMap } = await import('../../data/index.js');
  getMap.mockResolvedValue({
    id: 'test-map-id',
    name: 'Test Map',
    width: 10,
    height: 10,
    layers: [],
  });
  global.URL.createObjectURL = vi.fn(() => 'blob:mock');
  global.URL.revokeObjectURL = vi.fn();
  render(<MenuBar {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: 'File' }));
  await user.click(screen.getByText('Export'));
  expect(getMap).toHaveBeenCalledWith('test-map-id');
});

test('Export JSON uses the map name plus a timestamp as the download filename', async () => {
  const user = userEvent.setup();
  const { getMap } = await import('../../data/index.js');
  getMap.mockResolvedValue({
    id: 'test-map-id',
    name: 'My Cool Map',
    width: 10,
    height: 10,
    layers: [],
  });
  global.URL.createObjectURL = vi.fn(() => 'blob:mock');
  global.URL.revokeObjectURL = vi.fn();
  render(<MenuBar {...defaultProps} />);
  const anchors = [];
  const origCreate = document.createElement.bind(document);
  const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tag, ...args) => {
    const el = origCreate(tag, ...args);
    if (tag === 'a') anchors.push(el);
    return el;
  });
  await user.click(screen.getByRole('button', { name: 'File' }));
  await user.click(screen.getByText('Export'));
  expect(anchors).toHaveLength(1);
  expect(anchors[0].download).toMatch(/^my-cool-map-\d{4}-\d{2}-\d{2}_\d{6}\.json$/);
  createSpy.mockRestore();
});

test('clicking Import opens a file picker', async () => {
  const user = userEvent.setup();
  render(<MenuBar {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: 'File' }));
  const fileInput = document.querySelector('input[type="file"]');
  expect(fileInput).toBeInTheDocument();
  expect(fileInput.accept).toBe('.json');
});

test('importing valid JSON adds a new map and navigates to it', async () => {
  const user = userEvent.setup();
  const { addMap, createBlankMap } = await import('../../data/index.js');
  const newId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  addMap.mockResolvedValue(newId);
  const mapJson = JSON.stringify({ name: 'Imported Map', width: 5, height: 5, layers: [] });
  const file = new File([mapJson], 'imported.json', { type: 'application/json' });
  render(<MenuBar {...defaultProps} />);
  const fileInput = document.querySelector('input[type="file"]');
  expect(fileInput).toBeInTheDocument();
  await user.upload(fileInput, file);
  await vi.waitFor(() => expect(addMap).toHaveBeenCalledTimes(1));
  const addedMap = addMap.mock.calls[0][0];
  expect(createBlankMap).toHaveBeenCalledTimes(1);
  expect(addedMap.cellSize).toBe(40);
  expect(addedMap.focusX).toBe(0);
  expect(addedMap.name).toBe('Imported Map');
  expect(addedMap).not.toHaveProperty('id');
  expect(mockNavigateToMap).toHaveBeenCalledWith(newId);
});

test('importing invalid JSON shows an alert and does not add a map', async () => {
  const user = userEvent.setup();
  const { addMap } = await import('../../data/index.js');
  const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  const file = new File(['not valid json {{'], 'bad.json', { type: 'application/json' });
  render(<MenuBar {...defaultProps} />);
  const fileInput = document.querySelector('input[type="file"]');
  expect(fileInput).toBeInTheDocument();
  await user.upload(fileInput, file);
  await vi.waitFor(() => expect(alertSpy).toHaveBeenCalledWith('Could not read file: invalid JSON.'));
  expect(addMap).not.toHaveBeenCalled();
  alertSpy.mockRestore();
});

test('clicking Cut calls onCut and closes the dropdown', async () => {
  const user = userEvent.setup();
  const onCut = vi.fn();
  render(<MenuBar {...defaultProps} onCut={onCut} />);
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.click(screen.getByText('Cut'));
  expect(onCut).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Cut')).not.toBeInTheDocument();
});

test('clicking Copy calls onCopy and closes the dropdown', async () => {
  const user = userEvent.setup();
  const onCopy = vi.fn();
  render(<MenuBar {...defaultProps} onCopy={onCopy} />);
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.click(screen.getByText('Copy'));
  expect(onCopy).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Copy')).not.toBeInTheDocument();
});

test('clicking Paste calls onPaste and closes the dropdown', async () => {
  const user = userEvent.setup();
  const onPaste = vi.fn();
  render(<MenuBar {...defaultProps} onPaste={onPaste} />);
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.click(screen.getByText('Paste'));
  expect(onPaste).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Paste')).not.toBeInTheDocument();
});

test('clicking Clear calls onClear and closes the dropdown', async () => {
  const user = userEvent.setup();
  const onClear = vi.fn();
  render(<MenuBar {...defaultProps} onClear={onClear} />);
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.click(screen.getByText('Clear'));
  expect(onClear).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Clear')).not.toBeInTheDocument();
});

test('Cut, Copy, Paste, Clear show correct shortcut labels', async () => {
  const user = userEvent.setup();
  render(<MenuBar {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  expect(screen.getByText('X')).toBeInTheDocument();
  expect(screen.getByText('C')).toBeInTheDocument();
  expect(screen.getByText('V')).toBeInTheDocument();
  expect(screen.getByText('Z')).toBeInTheDocument();
});

test('clicking Undo calls onUndo and closes the dropdown', async () => {
  const user = userEvent.setup();
  const onUndo = vi.fn();
  render(<MenuBar {...defaultProps} onUndo={onUndo} onRedo={vi.fn()} canUndo={true} canRedo={false} />);
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.click(screen.getByText('Undo'));
  expect(onUndo).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Undo')).not.toBeInTheDocument();
});

test('clicking Redo calls onRedo and closes the dropdown', async () => {
  const user = userEvent.setup();
  const onRedo = vi.fn();
  render(<MenuBar {...defaultProps} onUndo={vi.fn()} onRedo={onRedo} canUndo={false} canRedo={true} />);
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.click(screen.getByText('Redo'));
  expect(onRedo).toHaveBeenCalledTimes(1);
  expect(screen.queryByText('Redo')).not.toBeInTheDocument();
});

test('Undo item does not call onUndo when canUndo is false', async () => {
  const user = userEvent.setup();
  const onUndo = vi.fn();
  render(<MenuBar {...defaultProps} onUndo={onUndo} onRedo={vi.fn()} canUndo={false} canRedo={false} />);
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.click(screen.getByText('Undo'));
  expect(onUndo).not.toHaveBeenCalled();
});

test('Redo item does not call onRedo when canRedo is false', async () => {
  const user = userEvent.setup();
  const onRedo = vi.fn();
  render(<MenuBar {...defaultProps} onUndo={vi.fn()} onRedo={onRedo} canUndo={false} canRedo={false} />);
  await user.click(screen.getByRole('button', { name: 'Edit' }));
  await user.click(screen.getByText('Redo'));
  expect(onRedo).not.toHaveBeenCalled();
});

test('clicking Open in File menu renders OpenMapDialog', async () => {
  const user = userEvent.setup();
  render(<MenuBar {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: 'File' }));
  await user.click(screen.getByText('Open'));
  expect(screen.getByTestId('open-map-dialog')).toBeInTheDocument();
});

test('clicking About in TSZ menu renders AboutDialog', async () => {
  const user = userEvent.setup();
  render(<MenuBar {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: 'TSZ' }));
  await user.click(screen.getByText('About'));
  expect(screen.getByTestId('about-dialog')).toBeInTheDocument();
});

test('clicking Shortcuts in TSZ menu renders ShortcutsDialog', async () => {
  const user = userEvent.setup();
  render(<MenuBar {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: 'TSZ' }));
  await user.click(screen.getByText('Shortcuts'));
  expect(screen.getByTestId('shortcuts-dialog')).toBeInTheDocument();
});

test('clicking Tutorial in TSZ menu renders TutorialDialog', async () => {
  const user = userEvent.setup();
  render(<MenuBar {...defaultProps} />);
  await user.click(screen.getByRole('button', { name: 'TSZ' }));
  await user.click(screen.getByText('Tutorial'));
  expect(screen.getByTestId('tutorial-dialog')).toBeInTheDocument();
});
