import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr'

// Removemos el plugin PWA ya que no es compatible con WebContainer
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest', // Usar nuestro propio SW
      srcDir: 'public',
      filename: 'service-worker.js', // Archivo SW personalizado
      manifest: {
        name: 'Hub Grupo Financial',
        short_name: 'HUB GF',
        description: 'Hub Grupo Financial es una aplicación que te permite acceder al sistema interno.',
        lang: 'es',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/icons/maskable_icon_x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/maskable_icon_x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})
