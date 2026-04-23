import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          'mapbox':   ['mapbox-gl'],
          'firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'react':    ['react', 'react-dom'],
        },
      },
    },
  },
});
