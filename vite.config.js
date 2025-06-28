import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// TODO
// Our argparse dependency relies on Node-only modules (assert, fs, path, etc.).
// To make it work in the browser, we need polyfills for these modules.
// It is also a CommonJS module, so we need to convert to ESM.

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    preact(),
    nodePolyfills({
      include: ['fs', 'path', 'process', 'querystring', 'stream', 'util'],
      globals: { global: true, process: true },
    }),
  ],
})
