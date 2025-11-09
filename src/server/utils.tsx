import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { renderToString } from 'react-dom/server';
import React from 'react';
import App from '../client/App.js';
import { fileURLToPath } from 'url';
import { PageModel } from '../shared/models/page.js';

//@ts-expect-error
import { StaticRouter } from 'react-router-dom/server';

import {
  dehydrate,
  DehydratedState,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const buildHtmlPage = async (req: Request, pageData: PageModel) => {
  let template = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf-8');

  template = await req.vite.transformIndexHtml(req.originalUrl, template);

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        retry: false,
      },
    },
  });

  if (pageData.$type === 'UserProfilePage') {
    queryClient.setQueryData(['user', pageData.id.toString()], pageData);
  }

  const appHtml = renderToString(
    <QueryClientProvider client={queryClient}>
      <StaticRouter location={req.originalUrl}>
        <App />
      </StaticRouter>
    </QueryClientProvider>
  );

  const dehydratedState = dehydrate(queryClient);

  queryClient.clear();

  const html = template
    .replace('<!--app-html-->', appHtml)
    .replace('"<!--dehydrated-state-->"', serializeDehydratedState(dehydratedState));

  return html;
};

export const serializeDehydratedState = (pageData: DehydratedState) =>
  JSON.stringify(pageData)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f');
