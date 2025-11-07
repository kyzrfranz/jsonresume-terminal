import { defineConfig } from 'vite';

export default defineConfig({
  root: 'demo', // your demo folder as root
  build: {
    outDir: '../dist',
    base: './'
  },
  optimizeDeps: {
    include: ["@kyzrfranz/jsonresume-terminal"]
  }
});
