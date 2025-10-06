import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        // ADD THIS BUILD BLOCK TO RESOLVE THE ROLLUP ERROR
        build: {
            rollupOptions: {
                external: ['workbox-window'] 
            }
        },
        // END OF BUILD BLOCK
        plugins: [
            react(),
            VitePWA({
                registerType: 'autoUpdate',
                injectRegister: 'auto',
                outDir: 'dist', 
                manifest: {
                    name: 'Mata Bionic AI',
                    short_name: 'Bionic Eye',
                    description: 'Aplikasi pendamping untuk tunanetra yang mendeskripsikan gambar secara real-time.',
                    theme_color: '#000000',
                    background_color: '#000000',
                    display: 'fullscreen',
                    scope: '/',
                    start_url: '/',
                    icons: [
                        { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
                        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
                        { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
                    ]
                },
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
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
