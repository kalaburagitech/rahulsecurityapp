import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': 'http://localhost:3001',
            '/getotp': 'http://localhost:3001',
            '/verify': 'http://localhost:3001',
        },
    },
})
