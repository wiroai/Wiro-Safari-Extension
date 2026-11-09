import type { KeyValueStore, Platform } from '../core/src/platform.js';
import { CALLBACK_URL } from './platform-constants.js';

export { AUTH_MESSAGE, CALLBACK_URL } from './platform-constants.js';

// Safari's side of the core: browser.storage and browser.tabs. Safari has no
// identity API (Apple: "Initiate an OAuth flow in a new tab"), so sign-in opens
// wiro.ai in a tab; wiro.ai sends the browser back to CALLBACK_URL, where the
// callback content script hands the address to the background, which finishes
// the sign-in (see background.ts).

function store(area: browser.storage.StorageArea, areaName: string): KeyValueStore {
  return {
    async get<T>(key: string) {
      const values = await area.get(key);
      return values[key] as T | undefined;
    },
    set: (key, value) => area.set({ [key]: value }),
    remove: key => area.remove(key),
    onChanged(listener) {
      const handler = (changes: Record<string, browser.storage.StorageChange>, name: string) => {
        if (name !== areaName) return;
        listener(Object.fromEntries(Object.entries(changes).map(([key, change]) => [key, change.newValue])));
      };
      browser.storage.onChanged.addListener(handler);
      return () => browser.storage.onChanged.removeListener(handler);
    },
  };
}

export const safariPlatform: Platform = {
  name: 'safari',
  version: browser.runtime.getManifest().version,
  storage: store(browser.storage.local, 'local'),
  session: store(browser.storage.session, 'session'),
  clientName: 'Wiro for Safari',
  redirectUri: () => CALLBACK_URL,
  async launchAuth(url) {
    await browser.tabs.create({ url });
    // The background finishes the sign-in; the panel follows it through storage.
    return undefined;
  },
  openTab: url => void browser.tabs.create({ url }),
};
