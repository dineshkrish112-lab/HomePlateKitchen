import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend (Spring Boot) runs on 8090. /api and /uploads are proxied so the browser sees one origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8090',
      '/uploads': 'http://localhost:8090',
    },
  },
});
