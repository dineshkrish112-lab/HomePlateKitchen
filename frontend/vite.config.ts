import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Backend (Spring Boot) runs on 8090 by default. /api and /uploads are proxied so the browser sees one origin.
// If the backend runs on another port, start the frontend with BACKEND_PORT, e.g. (PowerShell):
//   $env:BACKEND_PORT=8091; npm run dev
const backend = `http://localhost:${process.env.BACKEND_PORT || 8090}`;

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.FRONTEND_PORT || 5173),
    proxy: {
      '/api': backend,
      '/uploads': backend,
    },
  },
});
