import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  define: {
    global: 'window'
  },
  plugins: [
    react(),
    nodePolyfills(),
    // Optionally include the node polyfill plugin to cover more Node.js APIs
  ],
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser global polyfills
      define: {
        global: 'globalThis',
      },
      plugins: [
        NodeModulesPolyfillPlugin(), // This ensures other Node.js core modules are also polyfilled
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true, // Needed if you're working with Node.js process
        }),
      ]
    }
  },
  resolve: {
    alias: {
      process: "process/browser",
      stream: "stream-browserify",
      zlib: "browserify-zlib",
      util: 'util',
      buffer: 'buffer',
      // crypto: 'crypto-browserify' // Aliasing crypto to crypto-browserify for browser environments
    }
  }
});