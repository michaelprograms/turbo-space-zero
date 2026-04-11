import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context';
import { getMap, addMap, createBlankMap } from '../../data/index.js';

import OpenMapDialog from '../dialogs/OpenMapDialog.jsx';
import AboutDialog from '../dialogs/AboutDialog.jsx';
import ShortcutsDialog from '../dialogs/ShortcutsDialog.jsx';
import TutorialDialog from '../dialogs/TutorialDialog.jsx';
import { fileTimestamp } from '../map-view/utils';

import {
  MenuBarWrapper, TabBar, Tab, DropdownPanel,
  MenuItem, MenuItemLabel, MenuItemShortcut,
  ToggleRow, ToggleLabel, ToggleSwitch,
  ZoomRow, ZoomLabel, ZoomValue,
} from './style.js';

const TABS = ['tsz', 'file', 'edit', 'view'];
const TAB_LABELS = { tsz: 'TSZ', file: 'File', edit: 'Edit', view: 'View' };
const logoUrl = (darkMode) => `${import.meta.env.BASE_URL}${darkMode ? 'logo.svg' : 'logo-light.svg'}`;

function MenuBar({ onSave, onPrint, showGrid, onToggleGrid, showChunks, onToggleChunks, darkMode, onToggleDarkMode, is3DView, onToggle3DView, splitView, onToggleSplitView, cellSize, onCellSizeChange, theme, onCut, onCopy, onPaste, onClear, onUndo, onRedo, canUndo = false, canRedo = false }) {
  const { activeMapId, navigateToMap } = useAppContext();
  const [openMenu, setOpenMenu] = useState(null);
  const [openDialog, setOpenDialog] = useState(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!openMenu) return;
    const handleMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [openMenu]);

  const handleTabClick = (id) => setOpenMenu(prev => prev === id ? null : id);
  const close = () => setOpenMenu(null);

  const handleNew = async () => {
    close();
    const newMap = createBlankMap();
    const id = await addMap(newMap);
    navigateToMap(id);
  };

  const handleSave = () => { close(); onSave?.(); };
  const handlePrint = () => { close(); onPrint?.(); };

  const handleExportJson = async () => {
    close();
    const map = await getMap(activeMapId);
    if (!map) return;
    const { id: _id, ...exportData } = map;
    const json = JSON.stringify(exportData, null, 2);
    const slug = map.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || 'map';
    const filename = `${slug}-${fileTimestamp()}.json`;
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const handleImportJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = async (event) => {
      let parsed;
      try { parsed = JSON.parse(event.target.result); }
      catch { alert('Could not read file: invalid JSON.'); return; }
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        alert('Could not read file: invalid JSON.'); return;
      }
      const { id: _id, created: _created, edited: _edited, ...rest } = parsed;
      const newMap = { ...createBlankMap(), ...rest, created: Date.now(), edited: Date.now() };
      const newId = await addMap(newMap);
      navigateToMap(newId);
    };
    reader.onerror = () => alert('Could not read file.');
    reader.readAsText(file);
  };

  return (
    <>
      <MenuBarWrapper ref={menuRef} $theme={theme}>
        <TabBar $theme={theme}>
          {TABS.map(id => (
            <Tab key={id} type="button" $theme={theme} $active={openMenu === id} onClick={() => handleTabClick(id)}>
              {id === 'tsz' && (
                <img src={logoUrl(darkMode)} alt="" width={13} height={13}
                  style={{ verticalAlign: '-2px', marginRight: 5, borderRadius: 3 }} />
              )}
              {TAB_LABELS[id]}
            </Tab>
          ))}
        </TabBar>

        {openMenu === 'tsz' && (
          <DropdownPanel $theme={theme}>
            <MenuItem $theme={theme} onClick={() => { close(); setOpenDialog('about'); }}>
              <MenuItemLabel $theme={theme}>About</MenuItemLabel>
              <MenuItemShortcut $theme={theme} />
            </MenuItem>
            <MenuItem $theme={theme} onClick={() => { close(); setOpenDialog('shortcuts'); }}>
              <MenuItemLabel $theme={theme}>Shortcuts</MenuItemLabel>
              <MenuItemShortcut $theme={theme} />
            </MenuItem>
            <MenuItem $theme={theme} onClick={() => { close(); setOpenDialog('tutorial'); }}>
              <MenuItemLabel $theme={theme}>Tutorial</MenuItemLabel>
              <MenuItemShortcut $theme={theme} />
            </MenuItem>
          </DropdownPanel>
        )}

        {openMenu === 'file' && (
          <DropdownPanel $theme={theme}>
            <MenuItem $theme={theme} onClick={handleNew}>
              <MenuItemLabel $theme={theme}>New</MenuItemLabel>
              <MenuItemShortcut $theme={theme} />
            </MenuItem>
            <MenuItem $theme={theme} onClick={() => { close(); setOpenDialog('open'); }}>
              <MenuItemLabel $theme={theme}>Open</MenuItemLabel>
              <MenuItemShortcut $theme={theme} />
            </MenuItem>
            <MenuItem $theme={theme} onClick={handleSave}>
              <MenuItemLabel $theme={theme}>Save</MenuItemLabel>
              <MenuItemShortcut $theme={theme}>S</MenuItemShortcut>
            </MenuItem>
            <MenuItem $theme={theme} onClick={() => { close(); fileInputRef.current?.click(); }}>
              <MenuItemLabel $theme={theme}>Import</MenuItemLabel>
              <MenuItemShortcut $theme={theme} />
            </MenuItem>
            <MenuItem $theme={theme} onClick={handleExportJson}>
              <MenuItemLabel $theme={theme}>Export</MenuItemLabel>
              <MenuItemShortcut $theme={theme} />
            </MenuItem>
            <MenuItem $theme={theme} onClick={handlePrint}>
              <MenuItemLabel $theme={theme}>Print</MenuItemLabel>
              <MenuItemShortcut $theme={theme}>P</MenuItemShortcut>
            </MenuItem>
          </DropdownPanel>
        )}

        {openMenu === 'edit' && (
          <DropdownPanel $theme={theme}>
            <MenuItem $theme={theme} $todo={!canUndo} onClick={() => { if (!canUndo) return; close(); onUndo?.(); }}>
              <MenuItemLabel $theme={theme} $todo={!canUndo}>Undo</MenuItemLabel>
              <MenuItemShortcut $theme={theme}>⌘Z</MenuItemShortcut>
            </MenuItem>
            <MenuItem $theme={theme} $todo={!canRedo} onClick={() => { if (!canRedo) return; close(); onRedo?.(); }}>
              <MenuItemLabel $theme={theme} $todo={!canRedo}>Redo</MenuItemLabel>
              <MenuItemShortcut $theme={theme}>⌘⇧Z</MenuItemShortcut>
            </MenuItem>
            <MenuItem $theme={theme} onClick={() => { close(); onCut?.(); }}>
              <MenuItemLabel $theme={theme}>Cut</MenuItemLabel>
              <MenuItemShortcut $theme={theme}>X</MenuItemShortcut>
            </MenuItem>
            <MenuItem $theme={theme} onClick={() => { close(); onCopy?.(); }}>
              <MenuItemLabel $theme={theme}>Copy</MenuItemLabel>
              <MenuItemShortcut $theme={theme}>C</MenuItemShortcut>
            </MenuItem>
            <MenuItem $theme={theme} onClick={() => { close(); onPaste?.(); }}>
              <MenuItemLabel $theme={theme}>Paste</MenuItemLabel>
              <MenuItemShortcut $theme={theme}>V</MenuItemShortcut>
            </MenuItem>
            <MenuItem $theme={theme} onClick={() => { close(); onClear?.(); }}>
              <MenuItemLabel $theme={theme}>Clear</MenuItemLabel>
              <MenuItemShortcut $theme={theme}>Z</MenuItemShortcut>
            </MenuItem>
          </DropdownPanel>
        )}

        {openMenu === 'view' && (
          <DropdownPanel $theme={theme}>
            <ToggleRow $theme={theme}>
              <ToggleLabel $theme={theme}>Toggle Grid</ToggleLabel>
              <ToggleSwitch $on={showGrid} $theme={theme} onClick={onToggleGrid} role="switch" aria-checked={showGrid} aria-label="Toggle Grid" />
            </ToggleRow>
            <ToggleRow $theme={theme}>
              <ToggleLabel $theme={theme}>Chunk Guides</ToggleLabel>
              <ToggleSwitch $on={showChunks} $theme={theme} onClick={onToggleChunks} role="switch" aria-checked={showChunks} aria-label="Chunk Guides" />
            </ToggleRow>
            <ToggleRow $theme={theme}>
              <ToggleLabel $theme={theme}>Dark Mode</ToggleLabel>
              <ToggleSwitch $on={darkMode} $theme={theme} onClick={onToggleDarkMode} role="switch" aria-checked={darkMode} aria-label="Dark Mode" />
            </ToggleRow>
            <ToggleRow $theme={theme}>
              <ToggleLabel $theme={theme}>3D View</ToggleLabel>
              <ToggleSwitch $on={is3DView} $theme={theme} onClick={onToggle3DView} role="switch" aria-checked={is3DView} aria-label="3D View" />
            </ToggleRow>
            <ToggleRow $theme={theme}>
              <ToggleLabel $theme={theme}>Split 2D / 3D</ToggleLabel>
              <ToggleSwitch $on={splitView} $theme={theme} onClick={onToggleSplitView} role="switch" aria-checked={splitView} aria-label="Split 2D / 3D" />
            </ToggleRow>
            <ZoomRow $theme={theme}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <ZoomLabel $theme={theme}>Zoom</ZoomLabel>
                <ZoomValue $theme={theme}>{cellSize}px</ZoomValue>
              </div>
              <input
                type="range" min={20} max={80} step={1} value={cellSize}
                onChange={(e) => onCellSizeChange?.(Number(e.target.value))}
                style={{ width: '100%', accentColor: theme?.accentColor || '#106ba3' }}
              />
            </ZoomRow>
          </DropdownPanel>
        )}
      </MenuBarWrapper>

      {openDialog === 'open' && <OpenMapDialog onClose={() => setOpenDialog(null)} theme={theme} />}
      {openDialog === 'about' && <AboutDialog onClose={() => setOpenDialog(null)} theme={theme} darkMode={darkMode} />}
      {openDialog === 'shortcuts' && <ShortcutsDialog onClose={() => setOpenDialog(null)} theme={theme} />}
      {openDialog === 'tutorial' && <TutorialDialog onClose={() => setOpenDialog(null)} theme={theme} />}

      <input type="file" accept=".json" ref={fileInputRef} style={{ display: 'none' }} onChange={handleImportJson} />
    </>
  );
}

export default MenuBar;
