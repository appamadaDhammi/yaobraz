import { defineConfig, type Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'

function settingsApiPlugin(): Plugin {
  const settingsPath = path.resolve('settings.json');

  return {
    name: 'settings-api',
    configureServer(server) {
      server.middlewares.use('/api/settings', (req, res) => {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.end();
          return;
        }

        if (req.method === 'GET') {
          try {
            const data = fs.readFileSync(settingsPath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(data);
          } catch {
            res.setHeader('Content-Type', 'application/json');
            res.end('{}');
          }
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
          req.on('end', () => {
            fs.writeFileSync(settingsPath, body);
            res.end('ok');
          });
          return;
        }

        if (req.method === 'DELETE') {
          try { fs.unlinkSync(settingsPath); } catch { /* file may not exist */ }
          res.end('ok');
          return;
        }

        res.statusCode = 405;
        res.end('Method not allowed');
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    settingsApiPlugin(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },

  server: {
    host: '0.0.0.0'
  }
})
