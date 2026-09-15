import { useState, useEffect } from 'react';
import { useAppContext } from '../../context';
import { getMaps, deleteMap } from '../../data/index.js';
import Dialog from './Dialog.jsx';
import { MapListRow, MapListItem, DeleteMapButton, EmptyMessage } from './Dialog.style.js';

function OpenMapDialog({ onClose, theme }) {
  const { activeMapId, navigateToMap } = useAppContext();
  const [mapsData, setMapsData] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    getMaps().then(maps => { if (!cancelled) setMapsData(maps); });
    return () => { cancelled = true; };
  }, []);

  const handleSelect = (id) => {
    onClose();
    navigateToMap(id);
  };

  const handleDelete = async (map) => {
    // ponytail: native confirm — a destructive action shouldn't be one stray click
    if (!window.confirm(`Delete "${map.name}"? This cannot be undone.`)) return;
    await deleteMap(map.id);
    setMapsData(prev => prev.filter(m => m.id !== map.id));
  };

  return (
    <Dialog title="Open Map" onClose={onClose} theme={theme}>
      {mapsData === undefined ? null : mapsData.length > 0 ? (
        mapsData.map((map) => (
          <MapListRow key={map.id}>
            <MapListItem $theme={theme} onClick={() => handleSelect(map.id)}>
              {map.name}, {map.width}×{map.height}
            </MapListItem>
            <DeleteMapButton
              $theme={theme}
              type="button"
              aria-label={`Delete ${map.name}`}
              title={map.id === activeMapId ? 'Cannot delete the open map' : 'Delete map'}
              disabled={map.id === activeMapId}
              onClick={() => handleDelete(map)}
            >
              ✕
            </DeleteMapButton>
          </MapListRow>
        ))
      ) : (
        <EmptyMessage $theme={theme}>No saved maps found.</EmptyMessage>
      )}
    </Dialog>
  );
}

export default OpenMapDialog;
