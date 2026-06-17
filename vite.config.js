import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  base: './',
  plugins: [vue(), vuetify({
    autoImport: true,
  }), cloudflare()],
});