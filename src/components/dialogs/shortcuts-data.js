export const SHORTCUT_GROUPS = [
  {
    label: 'Navigation',
    shortcuts: [
      // Rows mirror the numpad layout (7 8 9 / 4 _ 6 / 1 2 3); cardinals also map to arrow keys.
      { action: 'Move northwest', mac: '7', win: '7' },
      { action: 'Move north', mac: '↑ · 8', win: '↑ · 8' },
      { action: 'Move northeast', mac: '9', win: '9' },
      { action: 'Move west', mac: '← · 4', win: '← · 4' },
      { action: 'Move east', mac: '→ · 6', win: '→ · 6' },
      { action: 'Move southwest', mac: '1', win: '1' },
      { action: 'Move south', mac: '↓ · 2', win: '↓ · 2' },
      { action: 'Move southeast', mac: '3', win: '3' },
      { action: 'Rectangular selection', mac: '⇧ + move', win: '⇧ + move' },
      { action: 'Additive multi-select', mac: '⌥ + move', win: 'Ctrl + move' },
      { action: 'Deselect', mac: 'Esc', win: 'Esc' },
    ],
  },
  {
    label: 'Editing',
    shortcuts: [
      { action: 'Toggle room', mac: 'Space', win: 'Space' },
      { action: 'Toggle quill mode', mac: 'Q', win: 'Q' },
      { action: 'Focus room text', mac: 'T', win: 'T' },
      { action: 'Copy', mac: 'C', win: 'C' },
      { action: 'Cut', mac: 'X', win: 'X' },
      { action: 'Paste', mac: 'V', win: 'V' },
      { action: 'Clear cell(s)', mac: 'Z', win: 'Z' },
      { action: 'Undo', mac: '⌘ Z', win: 'Ctrl Z' },
      { action: 'Redo', mac: '⌘ ⇧ Z', win: 'Ctrl ⇧ Z' },
    ],
  },
  {
    label: 'Exits',
    shortcuts: [
      { action: 'Toggle exit up (Z-axis)', mac: 'U or +', win: 'U or +' },
      { action: 'Toggle exit down (Z-axis)', mac: 'D or −', win: 'D or −' },
    ],
  },
  {
    label: 'Layers',
    shortcuts: [
      { action: 'Previous layer', mac: '[', win: '[' },
      { action: 'Next layer', mac: ']', win: ']' },
    ],
  },
  {
    label: 'File',
    shortcuts: [
      { action: 'Save', mac: 'S', win: 'S' },
      { action: 'Print / Export PNG', mac: 'P', win: 'P' },
    ],
  },
];
