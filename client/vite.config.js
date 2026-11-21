import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import routeStyleSplitter from './route-style-splitter.js';

const apiProxy = {
  '/api': 'http://127.0.0.1:5000',
  '/uploads': 'http://127.0.0.1:5000',
};

export default defineConfig({
  plugins: [routeStyleSplitter(), react()],
  server: {
    port: 5173,
    proxy: apiProxy,
  },
});
