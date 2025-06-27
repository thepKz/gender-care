import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  
  // Debug logging for environment variables
  console.log('🔧 Vite Config Debug:');
  console.log('  Mode:', mode);
  console.log('  Working Directory:', process.cwd());
  console.log('  Environment Variables:', env);
  console.log('  VITE_API_URL:', env.VITE_API_URL);

  return {
    plugins: [react()],
    // Ensure base path is correct for production
    base: mode === 'production' ? './' : '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      cors: {
        origin: [
          'http://localhost:3000',
          'http://localhost:5173',
          'http://localhost:5174',
          'https://pay.payos.vn',
          'https://payos.vn',
          'https://api.payos.vn'
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
      },
      headers: {
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
      },
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('❌ Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log('🔄 Proxying:', req.method, req.url, '→', proxyReq.getHeader('host'));
            });
          },
        },
      },
    },
    build: {
      // Ensure proper build output
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          // Ensure consistent asset naming
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/[name]-[hash][extname]`;
            }
            if (/woff2?|ttf|eot/i.test(ext)) {
              return `fonts/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
        },
      },
      // Copy additional files to build output
      copyPublicDir: true,
    },
    // Ensure all public files including web.config are copied
    publicDir: 'public',
  };
});