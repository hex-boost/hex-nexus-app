import { Toaster } from '@/components/ui/sonner.tsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import React from 'react';
import ReactDOM from 'react-dom/client';
import WebFont from 'webfontloader';
import { routeTree } from './routeTree.gen.ts';
import { useUserStore } from './stores/useUserStore.ts';
import './index.css';

WebFont.load({
  google: { families: ['Inter:100,200,300,400,500,600,700,800,900'] },
  active: () => {
    document.body.style.fontFamily = 'Inter, sans-serif';
  },

});

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
},
);





ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>

    <Toaster theme="dark" richColors />
    <ReactQueryDevtools client={queryClient} />
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
);
