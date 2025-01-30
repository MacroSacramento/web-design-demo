import path from "path";
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import wasm from 'vite-plugin-wasm';
import tailwindcss from '@tailwindcss/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy'

// https://vite.dev/config/
export default defineConfig({
    base: "/web-design-demo/",
    plugins: [
        wasm(),
        react(),
        tailwindcss(),
        viteStaticCopy({
            targets: [
                {
                    src: 'node_modules/@libav.js/variant-default/dist/*.wasm.*',
                    dest: 'assets/',
                },
            ],
        }),
    ],
    optimizeDeps: {
        exclude: ['@libav.js/variant-default']
    },
    // build: {
    //     rollupOptions: {
    //         external: ['@libav.js/variant-default'],
    //     }
    // },
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
