import './index.css';
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import App from './App';
import { PageModel } from '../shared/models/page';
import { BrowserRouter } from 'react-router-dom';
import { hydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query';

declare global {
  interface Window {
    __REACT_QUERY_INITIAL_DATA__?: PageModel;
  }
}

const reactQueryData = window.__REACT_QUERY_INITIAL_DATA__ ?? { $type: 'EmptyPage' };

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

if (reactQueryData) hydrate(queryClient, reactQueryData);

hydrateRoot(
  document.getElementById('root')!,
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </QueryClientProvider>
);
