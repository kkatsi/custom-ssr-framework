import { Request } from 'express';
import fs from 'fs';
import path from 'path';
import { renderToString } from 'react-dom/server';
import { fileURLToPath } from 'url';
import App from '../client/App.js';
import { PageModel } from '../shared/models/page.js';

//@ts-expect-error
import { StaticRouter } from 'react-router-dom/server';

import { getQueryConfigForPath } from '@/shared/config/routes.js';
import {
  dehydrate,
  DehydratedState,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { getSEOMetadata } from '@/shared/config/seo.js';
import { SEOBuilder } from './service/seo.js';

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

  populateQueryCache(queryClient, req.originalUrl, pageData);

  // Get SEO metadata
  const seoMetadata = getSEOMetadata(pageData, req.originalUrl);
  const seoBuilder = new SEOBuilder(seoMetadata, process.env.BASE_URL || 'https://myapp.com');

  // Build SEO tags
  const seoTags = seoBuilder.buildTags();
  const structuredData = seoBuilder.buildStructuredData();

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
    .replace('"<!--dehydrated-state-->"', serializeDehydratedState(dehydratedState))
    .replace('<!--seo-tags-->', seoTags)
    .replace('<!--structured-data-->', structuredData);

  return html;
};

export const serializeDehydratedState = (pageData: DehydratedState) =>
  JSON.stringify(pageData)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\//g, '\\u002f');

function populateQueryCache(queryClient: QueryClient, url: string, pageData: PageModel) {
  const result = getQueryConfigForPath(url);

  if (result) {
    const { config, params } = result;
    const queryOptions = config.getQueryOptions(params as any);

    queryClient.setQueryData(queryOptions.queryKey!, pageData);
  }
}
