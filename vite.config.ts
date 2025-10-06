import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // 👈 Import VitePWA

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [
            react(),
            // 👈 Add the VitePWA plugin configuration here
            VitePWA({
                registerType: 'autoUpdate',
                injectRegister: 'auto',
                outDir: 'dist', // Default Vercel build output folder
                manifest: {
                    name: 'Mata Bionic AI',
                    short_name: 'Bionic Eye',
                    description: 'Aplikasi pendamping untuk tunanetra yang mendeskripsikan gambar secara real-time.',
                    theme_color: '#000000',
                    background_color: '#000000',
                    display: 'fullscreen', // Critical for a native-like camera app
                    scope: '/',
                    start_url: '/',
                    icons: [
                        {
                            src: 'pwa-192x192.png',
                            sizes: '192x192',
                            type: 'image/png'
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png'
                        },
                        {
                            src: 'pwa-512x512.png',
                            sizes: '512x512',
                            type: 'image/png',
                            purpose: 'maskable' // Recommended for Android
                        }
                    ]
                },
                workbox: {
                    // Caches all static assets built by Vite
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
                }
            })
        ],
        define: {
            // Your API key definitions are correct
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