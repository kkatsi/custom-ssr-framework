import express from 'express';
import { createServer as createViteServer } from 'vite';
import { pagesRouter } from './routes/pages.js';
import { ssrMiddleware } from './middleware/ssr.js';
import { HttpClient } from './service/http-client.js';
import { BFFService } from './service/bff.js';
import { apiRouter } from './routes/api.js';

const app = express();

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'custom',
});

const httpClient = new HttpClient();
const bffService = new BFFService(httpClient);

app.use(vite.middlewares);
app.use((req, _, next) => {
  req.vite = vite;
  req.bff = bffService;
  next();
});
app.use(ssrMiddleware);
app.use('/', pagesRouter);
app.use('/api', apiRouter);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
