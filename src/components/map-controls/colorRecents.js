import { getSetting, setSetting } from '../../data/index.js';

// Global recent-colors list, persisted in the tsz-settings store. Shared across all maps.
const KEY = 'recentColors';
const CAP = 12;

let recents = null;      // null until first load
let loading = null;
const listeners = new Set();

function load() {
  if (recents) return Promise.resolve(recents);
  if (!loading) {
    loading = Promise.resolve()
      .then(() => getSetting(KEY))
      .then((v) => { recents = Array.isArray(v) ? v : []; return recents; })
      .catch(() => { recents = []; return recents; });
  }
  return loading;
}

export function getRecents() {
  return recents || [];
}

export function subscribe(fn) {
  listeners.add(fn);
  load().then(() => fn(getRecents()));
  return () => listeners.delete(fn);
}

export async function addRecent(hex) {
  if (!hex) return;
  await load();
  hex = hex.toLowerCase();
  recents = [hex, ...recents.filter((c) => c !== hex)].slice(0, CAP);
  listeners.forEach((fn) => fn(recents));
  Promise.resolve().then(() => setSetting(KEY, recents)).catch(() => {});
}
