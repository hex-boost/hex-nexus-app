import { Toaster } from '@/components/ui/sonner.tsx';
import * as Sentry from '@sentry/react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from '@tanstack/react-router';
import { FlagProvider } from '@unleash/proxy-client-react';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { router } from './instrument.ts';
import '@/index.css';

// Lazy load the production version of devtools
const ReactQueryDevtoolsProduction = lazy(() =>
  import('@tanstack/react-query-devtools/production').then(d => ({
    default: d.ReactQueryDevtools,
  })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      refetchOnWindowFocus: true,
    },
  },
});

const client = {
  url: 'https://primary-production-8693.up.railway.app/api/frontend',
  clientKey: '*:production.825408eb4a39c1335a6a4c258a24fe77e93c547a38209badd5ee2f6a',
  appName: 'my-frontend-app',
  environment: 'production',
  refreshInterval: 15, // seconds
};

// Create a wrapper component to handle the devtools
function App() {
  const [showDevtools, setShowDevtools] = useState(false);

  useEffect(() => {
    // @ts-ignore
    window.toggleDevtools = () => setShowDevtools(prev => !prev);
  }, []);

  return (
    <React.StrictMode>
      <Toaster
        theme="dark"
        richColors
        toastOptions={{
          classNames: {
            loading: '!bg-card border border-white/5 text-white',
          },
        }}
      />
      <QueryClientProvider client={queryClient}>

        <FlagProvider config={client}>
          <RouterProvider router={router} />
        </FlagProvider>
        {/* Development devtools - automatically excluded in production */}
        <ReactQueryDevtools initialIsOpen={false} />

        {/* Production devtools - only shown when toggled */}
        {showDevtools && (
          <Suspense fallback={null}>
            <ReactQueryDevtoolsProduction />
          </Suspense>
        )}
      </QueryClientProvider>
    </React.StrictMode>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement, {
  onUncaughtError: Sentry.reactErrorHandler((error, errorInfo) => {
    console.warn('Uncaught error', error, errorInfo.componentStack);
  }),
  onCaughtError: Sentry.reactErrorHandler(),
  onRecoverableError: Sentry.reactErrorHandler(),
}).render(
  <App />,
);
