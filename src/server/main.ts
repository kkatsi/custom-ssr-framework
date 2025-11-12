import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { pagesRouter } from './routes/pages.js';
import { ssrMiddleware } from './middleware/ssr.js';
import { HttpClient } from './service/http-client.js';
import { BFFService } from './service/bff.js';
import { apiRouter } from './routes/api.js';
import type { ViteDevServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

export async function createApp(vite: ViteDevServer | undefined) {
  const app = express();

  const httpClient = new HttpClient();
  const bffService = new BFFService(httpClient);

  // In production, serve static files. In dev, Vite handles this.
  if (!vite) {
    app.use(
      express.static(path.join(__dirname, '../client'), {
        index: false,
        maxAge: '1y',
      })
    );
  }

  // Your middleware to pass services and the Vite instance
  app.use((req, _, next) => {
    req.vite = vite || null; // Pass the Vite instance
    req.bff = bffService;
    next();
  });

  // Your routes and middleware
  app.use(ssrMiddleware);
  app.use('/api', apiRouter);
  app.use('/', pagesRouter);

  return app;
}

// This block only runs when you start this file directly in production
// (e.g., `node dist/server/main.js`)
if (isProduction) {
  (async () => {
    // Create the app with no Vite instance
    const app = await createApp(undefined);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log('📦 Mode: production');
    });
  })();
}
