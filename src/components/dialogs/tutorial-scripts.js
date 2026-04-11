import NewMapDemo from './tutorial-demos/NewMapDemo.jsx';
import OpenLoadDemo from './tutorial-demos/OpenLoadDemo.jsx';
import SaveDemo from './tutorial-demos/SaveDemo.jsx';
import ImportExportDemo from './tutorial-demos/ImportExportDemo.jsx';

export const TUTORIAL_CATEGORIES = [
  {
    label: 'Navigation',
    demos: [
      {
        id: 'moving-around',
        type: 'canvas',
        title: 'Moving Around',
        description: 'Use Arrow keys or Numpad (1–4, 6–9) to move in 8 directions across the grid.',
        frames: [
          { delay: 0,   focus: [1,1], cells: { '1,1':{exits:{}},'2,1':{exits:{}},'2,2':{exits:{}},'1,2':{exits:{}} }, mode:'normal', hint:null },
          { delay: 800, focus: [2,1], cells: { '1,1':{exits:{}},'2,1':{exits:{}},'2,2':{exits:{}},'1,2':{exits:{}} }, mode:'normal', hint:null },
          { delay: 700, focus: [2,2], cells: { '1,1':{exits:{}},'2,1':{exits:{}},'2,2':{exits:{}},'1,2':{exits:{}} }, mode:'normal', hint:null },
          { delay: 700, focus: [1,2], cells: { '1,1':{exits:{}},'2,1':{exits:{}},'2,2':{exits:{}},'1,2':{exits:{}} }, mode:'normal', hint:null },
          { delay: 700, focus: [1,1], cells: { '1,1':{exits:{}},'2,1':{exits:{}},'2,2':{exits:{}},'1,2':{exits:{}} }, mode:'normal', hint:null },
        ],
      },
      {
        id: 'quill-mode',
        type: 'canvas',
        title: '✦ Quill Mode',
        description: 'Press Q to enter Quill Mode. Moving the cursor creates rooms and bidirectional exits automatically.',
        frames: [
          { delay: 0,    focus:[1,2], cells:{}, mode:'normal', hint:'Press Q' },
          { delay: 1000, focus:[1,2], cells:{'1,2':{exits:{}}}, mode:'quill', hint:null },
          { delay: 700,  focus:[2,2], cells:{'1,2':{exits:{east:true}},'2,2':{exits:{west:true}}}, mode:'quill', hint:null },
          { delay: 700,  focus:[2,1], cells:{'1,2':{exits:{east:true}},'2,2':{exits:{west:true,north:true}},'2,1':{exits:{south:true}}}, mode:'quill', hint:null },
          { delay: 700,  focus:[3,1], cells:{'1,2':{exits:{east:true}},'2,2':{exits:{west:true,north:true}},'2,1':{exits:{south:true,east:true}},'3,1':{exits:{west:true}}}, mode:'quill', hint:null },
          { delay: 700,  focus:[3,2], cells:{'1,2':{exits:{east:true}},'2,2':{exits:{west:true,north:true}},'2,1':{exits:{south:true,east:true}},'3,1':{exits:{west:true,south:true}},'3,2':{exits:{north:true}}}, mode:'quill', hint:null },
        ],
      },
      {
        id: 'rect-selection',
        type: 'canvas',
        title: 'Rectangular Selection',
        description: 'Hold Shift while moving to select a rectangular region of cells. Release Shift when done.',
        frames: [
          { delay: 0,   focus:[1,1], cells:{'1,1':{exits:{}},'2,1':{exits:{}},'3,1':{exits:{}},'1,2':{exits:{}},'2,2':{exits:{}},'3,2':{exits:{}},'1,3':{exits:{}},'2,3':{exits:{}},'3,3':{exits:{}}}, mode:'normal', hint:null },
          { delay: 900, focus:[1,1], cells:{'1,1':{exits:{}},'2,1':{exits:{}},'3,1':{exits:{}},'1,2':{exits:{}},'2,2':{exits:{}},'3,2':{exits:{}},'1,3':{exits:{}},'2,3':{exits:{}},'3,3':{exits:{}}}, mode:'normal', hint:'Hold Shift + move' },
          { delay: 800, focus:[3,3], cells:{'1,1':{exits:{}},'2,1':{exits:{}},'3,1':{exits:{}},'1,2':{exits:{}},'2,2':{exits:{}},'3,2':{exits:{}},'1,3':{exits:{}},'2,3':{exits:{}},'3,3':{exits:{}}}, mode:'normal', hint:null },
        ],
      },
      {
        id: 'multi-select',
        type: 'canvas',
        title: 'Multi-Select',
        description: 'Hold Alt (Mac) or Ctrl (Win/Linux) while moving to add individual cells to your selection.',
        frames: [
          { delay: 0,   focus:[1,1], cells:{'1,1':{exits:{}},'2,2':{exits:{}},'3,1':{exits:{}},'1,3':{exits:{}}}, mode:'normal', hint:null },
          { delay: 900, focus:[1,1], cells:{'1,1':{exits:{}},'2,2':{exits:{}},'3,1':{exits:{}},'1,3':{exits:{}}}, mode:'normal', hint:'Hold Alt/Ctrl + move' },
          { delay: 800, focus:[3,1], cells:{'1,1':{exits:{}},'2,2':{exits:{}},'3,1':{exits:{}},'1,3':{exits:{}}}, mode:'normal', hint:null },
          { delay: 800, focus:[1,3], cells:{'1,1':{exits:{}},'2,2':{exits:{}},'3,1':{exits:{}},'1,3':{exits:{}}}, mode:'normal', hint:null },
        ],
      },
    ],
  },
  {
    label: 'Editing',
    demos: [
      {
        id: 'toggle-room',
        type: 'canvas',
        title: 'Toggle Room',
        description: 'Press Space to enable or disable the focused room.',
        frames: [
          { delay: 0,    focus:[2,2], cells:{}, mode:'normal', hint:'Press Space' },
          { delay: 900,  focus:[2,2], cells:{'2,2':{exits:{}}}, mode:'normal', hint:null },
          { delay: 900,  focus:[2,2], cells:{}, mode:'normal', hint:'Press Space again' },
          { delay: 900,  focus:[2,2], cells:{'2,2':{exits:{}}}, mode:'normal', hint:null },
        ],
      },
      {
        id: 'horizontal-exits',
        type: 'canvas',
        title: 'Horizontal Exits',
        description: 'Use the Map Controls panel to toggle exits in any direction, or use the keyboard shortcuts in the controls sidebar.',
        frames: [
          { delay: 0,   focus:[2,2], cells:{'1,2':{exits:{}},'2,2':{exits:{}},'3,2':{exits:{}},'2,1':{exits:{}},'2,3':{exits:{}}}, mode:'normal', hint:null },
          { delay: 700, focus:[2,2], cells:{'1,2':{exits:{east:true}},'2,2':{exits:{west:true}},'3,2':{exits:{}},'2,1':{exits:{}},'2,3':{exits:{}}}, mode:'normal', hint:null },
          { delay: 700, focus:[2,2], cells:{'1,2':{exits:{east:true}},'2,2':{exits:{west:true,east:true}},'3,2':{exits:{west:true}},'2,1':{exits:{}},'2,3':{exits:{}}}, mode:'normal', hint:null },
          { delay: 700, focus:[2,2], cells:{'1,2':{exits:{east:true}},'2,2':{exits:{west:true,east:true,north:true}},'3,2':{exits:{west:true}},'2,1':{exits:{south:true}},'2,3':{exits:{}}}, mode:'normal', hint:null },
          { delay: 700, focus:[2,2], cells:{'1,2':{exits:{east:true}},'2,2':{exits:{west:true,east:true,north:true,south:true}},'3,2':{exits:{west:true}},'2,1':{exits:{south:true}},'2,3':{exits:{north:true}}}, mode:'normal', hint:null },
        ],
      },
      {
        id: 'vertical-exits',
        type: 'canvas',
        title: 'Vertical Exits (Z)',
        description: 'Press U or + to add an up exit. Press D or − to add a down exit. These represent Z-axis connections between floors.',
        frames: [
          { delay: 0,    focus:[2,2], cells:{'2,2':{exits:{}}}, mode:'normal', hint:'Press U for up exit' },
          { delay: 1000, focus:[2,2], cells:{'2,2':{exits:{up:true}}}, mode:'normal', hint:null },
          { delay: 1000, focus:[2,2], cells:{'2,2':{exits:{up:true}}}, mode:'normal', hint:'Press D for down exit' },
          { delay: 1000, focus:[2,2], cells:{'2,2':{exits:{up:true,down:true}}}, mode:'normal', hint:null },
        ],
      },
      {
        id: 'room-text',
        type: 'canvas',
        title: 'Room Text',
        description: 'Press T to focus the room text input in the sidebar. Type a name or description for the currently focused room.',
        frames: [
          { delay: 0,    focus:[2,2], cells:{'2,2':{exits:{}}}, mode:'normal', hint:'Press T to add text' },
          { delay: 1200, focus:[2,2], cells:{'2,2':{exits:{},text:'Entrance'}}, mode:'normal', hint:null },
        ],
      },
      {
        id: 'nudge',
        type: 'canvas',
        title: 'Nudge',
        description: 'Use the Nudge controls in the sidebar to shift selected rooms one cell in any direction without breaking exit connections.',
        frames: [
          { delay: 0,   focus:[2,2], cells:{'2,2':{exits:{east:true}},'3,2':{exits:{west:true}}}, mode:'normal', hint:null },
          { delay: 900, focus:[3,2], cells:{'3,2':{exits:{east:true}},'4,2':{exits:{west:true}}}, mode:'normal', hint:null },
          { delay: 900, focus:[2,2], cells:{'2,2':{exits:{east:true}},'3,2':{exits:{west:true}}}, mode:'normal', hint:null },
        ],
      },
    ],
  },
  {
    label: 'Clipboard',
    demos: [
      {
        id: 'copy-paste',
        type: 'canvas',
        title: 'Copy / Paste',
        description: 'Press C to copy the focused cell (or selection). Press V to paste at the current cursor position.',
        frames: [
          { delay: 0,    focus:[1,1], cells:{'1,1':{exits:{east:true,south:true}},'2,1':{exits:{west:true}},'1,2':{exits:{north:true}}}, mode:'normal', hint:'Press C to copy' },
          { delay: 1000, focus:[3,3], cells:{'1,1':{exits:{east:true,south:true}},'2,1':{exits:{west:true}},'1,2':{exits:{north:true}}}, mode:'normal', hint:'Move, then press V' },
          { delay: 900,  focus:[3,3], cells:{'1,1':{exits:{east:true,south:true}},'2,1':{exits:{west:true}},'1,2':{exits:{north:true}},'3,3':{exits:{east:true,south:true}},'4,3':{exits:{west:true}},'3,4':{exits:{north:true}}}, mode:'normal', hint:null },
        ],
      },
      {
        id: 'cut-clear',
        type: 'canvas',
        title: 'Cut / Clear',
        description: 'Press X to cut (copies then clears). Press Z to clear the focused cell or selection without copying.',
        frames: [
          { delay: 0,    focus:[2,2], cells:{'1,1':{exits:{}},'2,2':{exits:{east:true}},'3,2':{exits:{west:true}},'2,3':{exits:{}}}, mode:'normal', hint:'Press Z to clear' },
          { delay: 1000, focus:[2,2], cells:{'1,1':{exits:{}},'3,2':{exits:{}},'2,3':{exits:{}}}, mode:'normal', hint:null },
        ],
      },
    ],
  },
  {
    label: 'File',
    demos: [
      { id:'new-map',       type:'ui', title:'New Map',         description:'Create a blank map from the File menu.',                                                    Component: NewMapDemo },
      { id:'open-load',     type:'ui', title:'Open / Load',     description:'Open an existing map from your saved maps list.',                                          Component: OpenLoadDemo },
      { id:'save',          type:'ui', title:'Save',            description:'Save your current map. Press S or use File → Save.',                                       Component: SaveDemo },
      { id:'import-export', type:'ui', title:'Import / Export', description:'Import a JSON file to load a map, or export your map as JSON or PNG.',                    Component: ImportExportDemo },
    ],
  },
  {
    label: 'Advanced',
    demos: [
      {
        id: 'layers',
        type: 'canvas',
        title: 'Layers',
        description: 'Press [ and ] to switch between layers. Each layer is an independent grid — use them for floors, zones, or anything you like.',
        frames: [
          { delay: 0,    focus:[2,2], cells:{'1,1':{exits:{}},'2,2':{exits:{east:true}},'3,2':{exits:{west:true}}}, mode:'normal', hint:'Press ] for next layer' },
          { delay: 1000, focus:[2,1], cells:{'2,1':{exits:{}},'3,1':{exits:{}},'2,2':{exits:{}}}, mode:'normal', hint:null },
          { delay: 1000, focus:[2,2], cells:{'1,1':{exits:{}},'2,2':{exits:{east:true}},'3,2':{exits:{west:true}}}, mode:'normal', hint:'Press [ for previous layer' },
        ],
      },
      {
        id: 'undo-redo',
        type: 'canvas',
        title: 'Undo / Redo',
        description: 'Press ⌘Z (Mac) or Ctrl+Z (Win/Linux) to undo. Press ⌘⇧Z or Ctrl+Shift+Z to redo.',
        frames: [
          { delay: 0,   focus:[2,2], cells:{'2,2':{exits:{east:true}},'3,2':{exits:{west:true}}}, mode:'normal', hint:null },
          { delay: 900, focus:[2,2], cells:{'2,2':{exits:{east:true,south:true}},'3,2':{exits:{west:true}},'2,3':{exits:{north:true}}}, mode:'normal', hint:'⌘Z to undo' },
          { delay: 900, focus:[2,2], cells:{'2,2':{exits:{east:true}},'3,2':{exits:{west:true}}}, mode:'normal', hint:'⌘⇧Z to redo' },
          { delay: 900, focus:[2,2], cells:{'2,2':{exits:{east:true,south:true}},'3,2':{exits:{west:true}},'2,3':{exits:{north:true}}}, mode:'normal', hint:null },
        ],
      },
    ],
  },
];

export const ALL_DEMOS = TUTORIAL_CATEGORIES.flatMap(c => c.demos);
