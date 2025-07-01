import { useUserStore } from '@/stores/useUserStore.ts';
import * as Sentry from '@sentry/react';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen.ts';

export const router = createRouter({
  routeTree,
  context: {
    auth: {
      isAuthenticated: () => useUserStore.getState().isAuthenticated(),
    },
  },
});
const release = import.meta.env.VITE_APP_VERSION || 'development';
Sentry.init({
  dsn: 'https://57f976075a4fde7d718f64a14383e365@o4509556130578433.ingest.us.sentry.io/4509585352097792', // <-- Paste your DSN here
  integrations: [
    Sentry.tanstackRouterBrowserTracingIntegration(router),
    Sentry.breadcrumbsIntegration({
      fetch: true,
      xhr: true,
      history: true,

      console: true,
      dom: true,
    }),
    Sentry.consoleLoggingIntegration({ levels: ['log', 'error', 'warn'] }),
    Sentry.replayIntegration(),

  ],
  release,
  replaysSessionSampleRate: 1.0, // Sample 10% of sessions for general analysis
  replaysOnErrorSampleRate: 1.0,
  _experiments: { enableLogs: true },
  tracePropagationTargets: [import.meta.env.VITE_API_URL || 'http://localhost:1337', /^\/api\//],

  tracesSampleRate: 0, // Disable performance monitoring
  sendDefaultPii: true,
  environment: import.meta.env.VITE_NODE_ENV || 'development',
});
