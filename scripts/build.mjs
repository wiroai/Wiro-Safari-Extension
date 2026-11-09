// Builds the web extension into dist/. The Xcode project in xcode/ points at
// these files, so run this before building the app in Xcode.
import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const preact = resolve(root, 'node_modules/preact');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

const common = {
  bundle: true,
  target: 'safari16',
  sourcemap: false,
  minify: false,
  jsx: 'automatic',
  jsxImportSource: 'preact',
  // One copy of Preact for the whole bundle, wherever the import comes from.
  alias: { preact },
  logLevel: 'warning',
};

// The service worker and the content script are classic scripts; the panel page loads a module.
await build({ ...common, format: 'iife', entryPoints: { background: resolve(root, 'src/background.ts'), callback: resolve(root, 'src/callback.ts') }, outdir: dist });
await build({ ...common, format: 'esm', entryPoints: { panel: resolve(root, 'src/panel.ts') }, outdir: dist, loader: { '.css': 'css' } });

await cp(resolve(root, 'public'), dist, { recursive: true });

const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
manifest.version = pkg.version;
await writeFile(resolve(dist, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Built web extension ${manifest.version} in dist/`);
