import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        id: '/',
        name: 'Mini CRM Web Application',
        short_name: 'CRM App',
        description: 'A comprehensive CRM application for managing leads and customers',
        start_url: '/',
        scope: '/',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'any',
        icons: [
          {
            src: '/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Enable automatic updates
        skipWaiting: true,
        clientsClaim: true,
        // Disable offline functionality - only cache essential app shell
        globPatterns: ['**/*.{js,css,html}'],
        // Remove runtime caching to prevent offline data access
        runtimeCaching: [],
        // Disable offline fallbacks
        navigateFallback: null,
        // Only cache app shell, not data
        dontCacheBustURLsMatching: /\.\w{8}\./
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
