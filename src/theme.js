/**
 * Theme system for Turbo Space Zero
 * Provides color palettes for light and dark modes
 */

const LIGHT_THEME = {
  // UI backgrounds
  backgroundColor: '#ffffff',
  panelBackground: '#f9f9f9',

  // Text colors
  textColor: '#222',
  textSecondary: '#333',

  // Borders and dividers
  borderColor: '#e5e5e5',
  borderColorLight: '#ccc',

  // Canvas
  canvasBackground: '#ffffff',
  gridStroke: '#E1E8ED',
  chunkStroke: '#9aa5b1',
  chunkLabel: '#7a8591',
  canvasBorder: '#9aa5b1',
  canvasOutOfBounds: '#dddddd',

  // Room defaults
  roomFill: '#999999',
  roomBorder: '#666666',

  // Accents and interactions
  accentColor: '#106ba3',
  focusHighlight: '#D4E8F5',
  selectionHighlight: '#B8D8F0',

  // Input/control styling
  inputBackground: '#fff',
  inputBorder: '#ccc',
  labelText: '#222222',

  // Export
  exportHeaderBackground: '#333333',
  exportHeaderText: '#dddddd',
  exportConnectorBackground: '#f0f0f0',
};

const DARK_THEME = {
  // UI backgrounds
  backgroundColor: '#2d2d30',
  panelBackground: '#1e1e1e',

  // Text colors
  textColor: '#e0e0e0',
  textSecondary: '#cccccc',

  // Borders and dividers
  borderColor: '#3e3e42',
  borderColorLight: '#4a4a4f',

  // Canvas
  canvasBackground: '#000000',
  gridStroke: '#404048',
  chunkStroke: '#6a6a78',
  chunkLabel: '#8a8a98',
  canvasBorder: '#5a5a62',
  canvasOutOfBounds: '#222222',

  // Room defaults (lighter for visibility on dark background)
  roomFill: '#aaaaaa',
  roomBorder: '#bbbbbb',

  // Accents and interactions
  accentColor: '#4fa3d5',
  focusHighlight: '#1f4a5c',
  selectionHighlight: '#2a5c72',

  // Input/control styling
  inputBackground: '#3e3e42',
  inputBorder: '#555555',
  labelText: '#ffffff',

  // Export
  exportHeaderBackground: '#1a1a1d',
  exportHeaderText: '#e0e0e0',
  exportConnectorBackground: '#2d2d30',
};

/**
 * Get theme colors for a given mode
 * @param {boolean} isDarkMode - Whether to return dark or light theme
 * @returns {Object} Theme color object
 */
export const getTheme = (isDarkMode) => {
  return isDarkMode ? DARK_THEME : LIGHT_THEME;
};
