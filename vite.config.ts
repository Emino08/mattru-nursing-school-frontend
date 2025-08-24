import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

export default defineConfig({
  plugins: [react(), tailwindcss(),],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // '/api': 'https://backend.msn.edu.sl',
      //   '/api': {
      //       target: 'https://backend.msn.edu.sl',
      //       changeOrigin: true,
      //       secure: false, // Set to true if using HTTPS
      //       rewrite: (path) => path.replace(/^\/api/, ''),
      //   },
      //
      //   '/api': {
      //       target: 'http://localhost:8000', // Replace with your actual backend URL
      //       changeOrigin: true,
      //       secure: false, // Set to true if using HTTPS
      //       rewrite: (path) => path.replace(/^\/api/, ''),
      //   },
    },
  },
})
