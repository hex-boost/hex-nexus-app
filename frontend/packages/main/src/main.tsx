import { Toaster } from '@/components/ui/sonner.tsx';
import * as Sentry from '@sentry/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from '@tanstack/react-router';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { UnleashClient } from 'unleash-proxy-client';
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

const client = new UnleashClient({
  url: 'https://primary-production-8693.up.railway.app/api/frontend/',
  clientKey: '*:production.825408eb4a39c1335a6a4c258a24fe77e93c547a38209badd5ee2f6a',
  appName: 'my-frontend-app',
  environment: 'production',
  refreshInterval: 15, // seconds
});
client.start();

client.on('synchronized', () => {
  console.log('Unleash client is synchronized with the server.');

  // Check a feature flag
  if (client.isEnabled('some-flag')) {
    // do cool new things when the flag is enabled
  }
});
client.on('ready', () => {
  if (client.isEnabled('is-new-payment')) {
    console.log('Feature flag \'your-feature-flag\' is enabled');
  } else {
    console.log('Feature flag \'your-feature-flag\' is disabled');
  }
});

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
        <RouterProvider router={router} />

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
}).render(<App />);
