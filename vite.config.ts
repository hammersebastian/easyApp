import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const productName = env.VITE_PRODUCT_NAME || '34d-Lernapp';
  const base = env.VITE_BASE_PATH || '/';

  return {
    base,
    plugins: [
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['assets/logo-mark.png'],
        manifest: {
          name: productName,
          short_name: productName,
          description: 'Lernapp zur Vorbereitung auf die Sachkundeprüfung Versicherungsvermittlung',
          theme_color: '#3C806B',
          background_color: '#F7FAF4',
          display: 'standalone',
          start_url: base,
          scope: base,
          icons: [
            { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png' },
            { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png' },
            { src: `${base}icons/icon-512-maskable.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' }
          ]
        },
        workbox: {
          navigateFallback: `${base}index.html`,
          globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
          runtimeCaching: [],
          navigateFallbackDenylist: [/^\/auth\//, /^\/rest\//, /^\/rpc\//]
        }
      })
    ],
    server: { port: 5173, host: true },
    preview: { port: 4173, host: true },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      coverage: { reporter: ['text', 'html'], include: ['src/domain/**', 'src/lib/**'] }
    }
  };
});
