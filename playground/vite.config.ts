/// <reference types="vitest" />

import path from 'node:path'
import process from 'node:process'
import Vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import Pages from 'vite-plugin-pages'

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '~/',
        replacement: `${path.resolve(__dirname, 'src')}/`,
      },
      {
        find: /@opentiny\/vue-theme\/(?!(smb))/,
        replacement: '@opentiny/vue-theme/smb-theme/',
      },
    ],
  },
  define: {
    'process.env': { ...process.env },
  },
  plugins: [
    Vue({
      reactivityTransform: path.resolve(__dirname, 'src'),
    }),

    // https://github.com/hannoeru/vite-plugin-pages
    Pages(),

    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: ['vue', 'vue-router', '@vueuse/core'],
      dts: true,
    }),

    // https://github.com/antfu/vite-plugin-components
    Components({
      dts: true,
    }),

    // https://github.com/antfu/unocss

    // see unocss.config.ts for config
    // Unocss(),
  ],

  // https://github.com/vitest-dev/vitest
  test: {
    environment: 'jsdom',
  },
})
