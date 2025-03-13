import React from 'react'
import { routeTree } from './routeTree.gen.ts'
import ReactDOM from 'react-dom/client'
import './index.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { useUserStore } from './stores/useUserStore.ts';

// import { ReactQueryDevtoolsPanel } from '@tanstack/react-query-devtools'
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000, // dados ficam frescos por 1 minuto
      refetchOnWindowFocus: true, // não refaz a consulta ao focar na janela
    },
  },
});
const router = createRouter({
  routeTree,
  context: {
    auth: {
      isAuthenticated: () => useUserStore.getState().isAuthenticated(),
    }
  }
}
)
// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>

    {/*<ReactQueryDevtoolsPanel client={queryClient} />*/}
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>,
)
