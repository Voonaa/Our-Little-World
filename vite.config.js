import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    strictPort: false,
    host: true // listen on all addresses, including LAN and localhost
  }
});
