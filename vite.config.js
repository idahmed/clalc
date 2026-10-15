import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'sitemap.xml'],
      manifest: {
        name: 'Scientific Calculator - Free Online Calculator',
        short_name: 'Calculator',
        description: 'Free online scientific calculator with sin, cos, tan, logarithms, memory functions, and calculation history. Works offline.',
        theme_color: '#1c1c1c',
        background_color: '#f3f3f3',
        display: 'standalone',
        start_url: '/',
        id: '/',
        scope: '/',
        orientation: 'any',
        categories: ['utilities', 'productivity', 'education'],
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Calculator',
            short_name: 'Calc',
            description: 'Open the calculator',
            url: '/',
            icons: [{ src: '/favicon.svg', sizes: 'any' }],
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,woff,woff2,ico,txt,xml}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
