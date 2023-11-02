/// <reference types="vitest" />
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';
import checker from 'vite-plugin-checker';

export default defineConfig(() => {
  return {
    root: './',
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
          cookieDomainRewrite: '',
        },
      },
    },
    plugins: [
      react({ plugins: [['@swc/plugin-styled-components', {}]] }),
      svgr(),
      checker({
        typescript: true,
      }),
    ],
  };
});
