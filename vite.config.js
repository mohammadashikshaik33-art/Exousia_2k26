import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
        verify: resolve(__dirname, 'verify.html'),
        coordinator: resolve(__dirname, 'coordinator.html'),
        feedback: resolve(__dirname, 'feedback.html'),
        audioTest: resolve(__dirname, 'audio-test.html')
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
