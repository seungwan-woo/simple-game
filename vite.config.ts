import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/simple-game/',
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
