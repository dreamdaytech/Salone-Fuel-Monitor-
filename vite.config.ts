import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    build: {
      target: 'es2021',
      outDir: 'dist',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            // Firebase — large, rarely changes
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage', 'firebase/analytics', 'firebase/messaging'],
            // Recharts — charting library
            'vendor-recharts': ['recharts'],
            // Leaflet / maps
            'vendor-leaflet': ['leaflet', 'react-leaflet', 'react-leaflet-cluster'],
            // React core
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // Motion / animation
            'vendor-motion': ['motion'],
            // PDF / export
            'vendor-pdf': ['jspdf', 'jspdf-autotable', 'html-to-image'],
          }
        }
      }
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png'],
        manifest: {
          name: 'Salone Fuel Monitor',
          short_name: 'FuelMonitor',
          description: 'Track fuel and transport prices in Sierra Leone',
          theme_color: '#ffffff',
          icons: [
            {
              src: '/logo.png',
              sizes: 'any',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 5000000,
          // Activate new builds immediately and remove obsolete precaches.
          // Admin navigations deliberately bypass the service-worker app-shell
          // fallback so a refresh always receives the latest index.html and
          // hashed JS bundles instead of a stale admin runtime.
          skipWaiting: true,
          clientsClaim: true,
          cleanupOutdatedCaches: true,
          navigateFallbackDenylist: [/^\/admin(?:\/|$)/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/supabase\.com\/.*$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*$/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'supabase-data-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7,
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY),
      'process.env.VITE_SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.SUPABASE_ANON_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
    esbuild: {
      target: 'esnext'
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext',
      }
    }
  };
});
