import { Toaster } from '@/components/ui/sonner.tsx';
import { useUserStore } from '@/stores/useUserStore.ts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { routeTree } from './routeTree.gen.ts';
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

const router = createRouter({
  routeTree,
  context: {
    auth: {
      isAuthenticated: () => useUserStore.getState().isAuthenticated(),
    },
  },
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

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(<App />);
