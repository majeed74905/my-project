
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');

  console.log('[Vite Config] Loading environment variables...');
  console.log('[Vite Config] API_KEY:', env.API_KEY ? `Found (${env.API_KEY.substring(0, 10)}...)` : 'NOT FOUND');

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(process.cwd()),
      },
    },
    define: {
      // This is critical: It replaces process.env.API_KEY in your code with the actual string during build
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    }
  };
});
