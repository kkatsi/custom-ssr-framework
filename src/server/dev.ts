// src/server/dev.ts

import express from 'express';
import https from 'node:https'; // Use native Node.js https
import { createServer as createViteServer } from 'vite';
import { createApp } from './main.js'; // Your Express app factory

async function startDevServer() {
  const app = express(); // Create your Express app

  // 1. Create the Vite server in middleware mode.
  // This loads vite.config.ts and runs plugins like mkcert.
  const vite = await createViteServer({
    server: { middlewareMode: true }, // We will control the server
    appType: 'custom',
  });

  // 2. Use Vite's middlewares.
  app.use(vite.middlewares);

  // 3. Use your app's routes.
  const appWithRoutes = await createApp(vite);
  app.use(appWithRoutes);

  // 4. Get the HTTPS options from Vite's *resolved* config.
  // As the error proved, `httpsOptions.key` and `httpsOptions.cert`
  // contain the *actual key/cert content*, not paths.
  const httpsOptions = vite.config.server.https;
  if (
    !httpsOptions ||
    typeof httpsOptions !== 'object' ||
    !httpsOptions.key ||
    !httpsOptions.cert
  ) {
    throw new Error('HTTPS config (key/cert) not found. Did vite-plugin-mkcert run?');
  }

  // 5. Create the native Node.js HTTPS server.
  const httpsServer = https.createServer(
    {
      //
      // 👇 THE FIX: Pass the key and cert content directly.
      //    DO NOT use fs.readFileSync().
      //
      key: httpsOptions.key,
      cert: httpsOptions.cert,
    },
    app // Use your Express app as the handler
  );

  // 6. Listen on the HTTPS server.
  const port = vite.config.server.port || 3000;
  httpsServer.listen(port, () => {
    console.log(`✅ Server running in DEV mode on https://localhost:${port}`);
    vite.bindCLIShortcuts({ print: true });
  });
}

startDevServer();
