import { Request } from 'express';
import fs from 'fs';
import path from 'path';
import { renderToString } from 'react-dom/server';
import { fileURLToPath } from 'url';
import { getQueryConfigForPath } from '@/shared/config/routes.js';
import { getSEOMetadata } from '@/shared/config/seo.js';
import {
  dehydrate,
  DehydratedState,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
//@ts-ignore
import { StaticRouter } from 'react-router-dom/server.mjs';
import { PageModel } from '../shared/models/page.js';
import { SEOBuilder } from './service/seo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';

export const buildHtmlPage = async (req: Request, pageData: PageModel) => {
  let template: string;
  let App: any;

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

  if (!isProduction && req.vite) {
    // === DEVELOPMENT ===
    // 1. Read the base index.html
    template = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf-8');

    // 2. Let Vite transform it (injects HMR client, CSS links, etc.)
    template = await req.vite.transformIndexHtml(req.originalUrl, template);

    // 3. Load the App *through* Vite's SSR loader.
    // This is the magic: Vite handles the .tsx and .css imports.
    const { default: AppComponent } = await req.vite.ssrLoadModule('/src/client/App.tsx');
    App = AppComponent;
  } else {
    // === PRODUCTION ===
    // 1. Read the *built* client index.html
    template = fs.readFileSync(path.resolve(__dirname, '../../client/index.html'), 'utf-8');

    // 2. Dynamically import the App component.
    // The Vite server build will see this and bundle App.tsx correctly.
    // Adjust the path if needed, relative to this file (buildHtmlPage.ts)
    const { default: AppComponent } = await import('../client/App.js');
    App = AppComponent;
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
