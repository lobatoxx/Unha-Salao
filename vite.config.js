import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Schedule - Gestão Completa',
        short_name: 'Schedule',
        description: 'Aplicativo de gestão completa para salões e barbearias.',
        theme_color: '#374151',
        icons: [
          {
            src: 'https://placehold.co/192x192/374151/FFFFFF?text=SC',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://placehold.co/512x512/374151/FFFFFF?text=SC',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Encontra e guarda em cache os arquivos finais de JS, CSS, HTML, etc.
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ]
})
