import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/predict': 'http://localhost:5000',
      '/feedback': 'http://localhost:5000',
      '/feedbacks': 'http://localhost:5000',
      '/gradcam': 'http://localhost:5000',
      '/static': 'http://localhost:5000',
    },
  },
});
