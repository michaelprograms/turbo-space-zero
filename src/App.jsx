import { useAppContext } from './context';

import MapView from './components/map-view';

import './App.css';

function App () {
  const { isReady } = useAppContext();

  if (!isReady) {
    return <div className="App">Loading...</div>;
  }

  return (
    <div className="App">
      <MapView />
    </div>
  );
}

export default App;
