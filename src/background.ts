import { buildMenus, jobFromClick, JOB_KEY, type MenusApi } from '../core/src/background/menus.js';
import { loadCatalog } from '../core/src/catalog/catalog.js';
import { DEFAULT_CONFIG } from '../core/src/config.js';
import { OAuth } from '../core/src/auth/oauth.js';
import { AUTH_MESSAGE, CALLBACK_URL, safariPlatform } from './platform.js';

// The background: builds the right-click menus, opens the panel for a click,
// and finishes the sign-in when wiro.ai sends the browser back.

const PANEL_TAB_KEY = 'wiro.safari.panelTab';

const menus: MenusApi = {
  removeAll: () => browser.contextMenus.removeAll(),
  create(item) {
    browser.contextMenus.create({
      id: item.id,
      parentId: item.parentId,
      title: item.title,
      type: item.type ?? 'normal',
      contexts: item.contexts as browser.contextMenus.ContextType[] | undefined,
    });
  },
};

async function setUpMenus(): Promise<void> {
  const catalog = await loadCatalog(safariPlatform.storage, DEFAULT_CONFIG.catalogUrl);
  await buildMenus(menus, catalog);
}

browser.runtime.onInstalled.addListener(() => void setUpMenus());
browser.runtime.onStartup.addListener(() => void setUpMenus());

// Safari has no side panel, and its toolbar popup closes when focus moves, so a
// right-click opens the panel in a tab. A second click reuses that tab.
async function showPanel(): Promise<void> {
  const known = await safariPlatform.session.get<number>(PANEL_TAB_KEY);
  if (typeof known === 'number') {
    try {
      await browser.tabs.update(known, { active: true });
      return;
    } catch {
      // That tab was closed.
    }
  }
  const tab = await browser.tabs.create({ url: browser.runtime.getURL('panel.html') });
  if (tab.id !== undefined) await safariPlatform.session.set(PANEL_TAB_KEY, tab.id);
}

browser.contextMenus.onClicked.addListener((info, tab) => {
  const job = jobFromClick(info, tab);
  if (!job) return;
  void browser.storage.session.set({ [JOB_KEY]: job }).then(showPanel);
});

const oauth = new OAuth(safariPlatform, DEFAULT_CONFIG);

interface AuthCallback {
  type: string;
  url: string;
}

browser.runtime.onMessage.addListener((message: unknown, sender: browser.runtime.MessageSender) => {
  const callback = message as AuthCallback | undefined;
  if (callback?.type !== AUTH_MESSAGE || typeof callback.url !== 'string') return undefined;
  // Only the callback content script on wiro.ai may finish a sign-in.
  if (sender.id !== browser.runtime.id || !sender.url?.startsWith(CALLBACK_URL) || !callback.url.startsWith(CALLBACK_URL)) return undefined;
  return oauth.completeSignIn(callback.url).then(
    () => {
      if (sender.tab?.id !== undefined) void browser.tabs.remove(sender.tab.id);
      return { ok: true };
    },
    (error: unknown) => ({ ok: false, error: error instanceof Error ? error.message : String(error) }),
  );
});
