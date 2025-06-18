import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

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
    base: '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('❌ Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('🔄 Proxying:', req.method, req.url, '→', proxyReq.getHeader('host'));
            });
          },
        },
      },
    },
    build: {
      rollupOptions: {},
    },
  };
});