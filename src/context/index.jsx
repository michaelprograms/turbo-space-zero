import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getSetting, setSetting, getMap, getOrCreateDefaultMap } from '../data/index.js';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [activeMapId, setActiveMapId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  const bootedRef = useRef(false);

  // Boot: load last-viewed map or create a blank one
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    (async () => {
      let mapId = await getSetting('lastViewedMapId') || null;

      if (mapId) {
        const exists = await getMap(mapId);
        if (!exists) mapId = null;
      }

      if (!mapId) {
        const map = await getOrCreateDefaultMap();
        mapId = map.id;
      }

      setActiveMapId(mapId);
      setIsReady(true);
    })();
  }, []);

  // Persist last-viewed map ID whenever it changes
  useEffect(() => {
    if (activeMapId) {
      setSetting('lastViewedMapId', activeMapId);
    }
  }, [activeMapId]);

  const navigateToMap = (mapId) => {
    setActiveMapId(mapId);
  };

  const value = {
    activeMapId,
    isReady,
    navigateToMap,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
