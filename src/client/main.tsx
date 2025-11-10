import { hydrate, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { PageModel } from '../shared/models/page';
import App from './App';
import './index.css';
import ErrorBoundary from './components/ErrorBoundary';

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
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </ErrorBoundary>
);
