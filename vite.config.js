import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'BelezaJá - Gestão Completa',
        short_name: 'BelezaJá',
        description: 'Aplicativo de gestão completa para salões de beleza.',
        theme_color: '#EC4899',
        icons: [
          {
            src: 'https://placehold.co/192x192/EC4899/FFFFFF?text=BJ',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://placehold.co/512x512/EC4899/FFFFFF?text=BJ',
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