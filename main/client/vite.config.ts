import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5176,
        host: true,
    },
    build: {
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'recharts', 'lucide-react', 'axios'],
                    utils: ['jspdf', 'jspdf-autotable', 'react-barcode']
                }
            }
        }
    }
})
