import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Config PWA offline-first: cachea el shell de la app y expone
// manifest para "Agregar a pantalla de inicio" en tablet/celular/PC.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Conteo de Inventario',
        short_name: 'Inventario',
        description: 'Conteo físico de Maderas y Ferretería con cuadratura en tiempo real',
        theme_color: '#15171A',
        background_color: '#15171A',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Cachea el shell de la app; los datos van por IndexedDB (Dexie), no por cache HTTP,
        // porque necesitamos lectura/escritura estructurada offline, no solo assets estáticos.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        runtimeCaching: [
          {
            // Cachea respuestas del API de existencias para poder abrir la app
            // sin señal y ver el último saldo conocido.
            urlPattern: ({ url }) => url.pathname.includes('/existencias'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'existencias-api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 12 },
            },
          },
        ],
      },
    }),
  ],
  server: { host: true, port: 5173 },
});
