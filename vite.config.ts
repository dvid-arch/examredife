import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 5000,
      host: '0.0.0.0',
      allowedHosts: true,
      middlewareMode: false,
      proxy: {
        '/api': {
          target: 'https://examredi-backend.onrender.com',
          changeOrigin: true,
          rewrite: (path) => path,
        }
      }
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          navigateFallback: '/offline.html',
          navigateFallbackDenylist: [/^\/api\//],
        },
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'ExamRedi AI Study Platform',
          short_name: 'ExamRedi',
          description: 'AI-powered exam preparation platform',
          theme_color: '#1E8449',
          background_color: '#f1f5f9',
          display: 'standalone',
          icons: [
            {
              src: 'https://assets.website-files.com/62e8f5c9dbfdcc62e8d28712/62e8f5c9dbfdccb465d28747_ExamRedi-Logo-512.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://assets.website-files.com/62e8f5c9dbfdcc62e8d28712/62e8f5c9dbfdccb465d28747_ExamRedi-Logo-512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});

