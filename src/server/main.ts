import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { pagesRouter } from './routes/pages.js';
import { ssrMiddleware } from './middleware/ssr.js';
import { HttpClient } from './service/http-client.js';
import { BFFService } from './service/bff.js';
import { apiRouter } from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

const app = express();

const httpClient = new HttpClient();
const bffService = new BFFService(httpClient);

let vite = null;

if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });

  app.use(vite.middlewares);
} else {
  app.use(
    express.static(path.join(__dirname, '../client'), {
      index: false,
      maxAge: '1y', // Cache static assets for 1 year
    })
  );
}

app.use((req, _, next) => {
  req.vite = vite || null;
  req.bff = bffService;
  next();
});

app.use(ssrMiddleware);
app.use('/api', apiRouter);
app.use('/', pagesRouter);

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Mode: ${isProduction ? 'production' : 'development'}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n👋 Shutting down gracefully...');

  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  if (vite) {
    await vite.close();
    console.log('✅ Vite server closed');
  }

  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
