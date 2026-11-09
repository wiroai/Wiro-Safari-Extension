# Wiro for Safari

Right-click an image, video, audio clip, selected text or a page to run Wiro AI models and tools from Safari on the Mac: animate, edit, upscale, restore, read aloud, transcribe, translate and more. The models come live from Wiro's categories, so new models show up without an update.

The shared code (sign-in, MCP client, actions, gateway, pricing, panel) lives in [Wiro-Extension-Core](https://github.com/wiroai/Wiro-Extension-Core), included here as the `core/` submodule. This repo adds the Safari parts:

- `src/platform.ts`: storage and tabs for the core.
- `src/background.ts`: the service worker. It builds the right-click menus, opens the panel for a click and finishes the sign-in.
- `src/callback.ts`: a content script that runs only on `https://wiro.ai/extension/callback`.
- `src/panel.ts`, `public/panel.html`: the panel, shown as the toolbar popup and in a tab.
- `manifest.json`: Manifest V3 for Safari 16.4 and later.
- `xcode/Wiro/`: the macOS app that carries the extension, made with `xcrun safari-web-extension-converter`. Its extension target points at the files in `dist/`.

## How Safari differs

- **No side panel.** The toolbar button opens the panel as a popup. A right-click opens the panel in a tab (a second click reuses that tab), because Safari's popup closes as soon as focus moves.
- **No identity API.** Apple's guidance is to "Initiate an OAuth flow in a new tab". The sign-in opens wiro.ai in a tab; wiro.ai sends the browser back to `https://wiro.ai/extension/callback`; the callback content script hands that address to the background, which checks it and trades the one-time code for tokens (PKCE, the verifier never leaves the extension), then closes the tab. The panel follows the sign-in through storage.
- **Mac only for now.** Safari on iOS has no context menus.

This needs two things on the Wiro side: the callback page at `https://wiro.ai/extension/callback`, and that address on the sign-in server's list of known redirect addresses. Safari asks the user once to let the extension run on that wiro.ai page.

## Build

```bash
git clone --recurse-submodules https://github.com/wiroai/Wiro-Safari-Extension.git
cd Wiro-Safari-Extension
npm install
(cd core && npm install)
npm run typecheck
npm run build
npm run xcode
```

`npm run xcode` builds the app without signing, as a compile check. To run it, open `xcode/Wiro/Wiro.xcodeproj`, choose the Wiro team under Signing & Capabilities for both targets, and run the Wiro scheme. Then turn the extension on in Safari Settings > Extensions. A build signed only for development needs Develop > Allow Unsigned Extensions (show the Develop menu under Settings > Advanced).

After a core change: `git -C core pull origin main`, rebuild, and commit the new `core` pointer. After adding a file to `dist/`, add it to the extension target in Xcode as well.

## App Store

The app is distributed through the Mac App Store, which needs an Apple Developer Program membership. In Xcode, Product > Archive, then upload to App Store Connect. The bundle identifiers are `ai.wiro.safari` (app) and `ai.wiro.safari.Extension` (extension).

## Permissions

| Permission | Why |
| --- | --- |
| `contextMenus` | the Wiro entries in the right-click menu |
| `storage` | the sign-in tokens, the tray, run history and the last model picked per action |
| content script on `https://wiro.ai/extension/callback*` | finishing the sign-in |

The extension reads only what a right-click hands it (the item's address, the selected text, the page address) and sends it to Wiro when the user starts a run.
