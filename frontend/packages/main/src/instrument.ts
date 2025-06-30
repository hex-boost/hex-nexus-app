import { useUserStore } from '@/stores/useUserStore.ts';
import * as Sentry from '@sentry/react';
import { createRouter } from '@tanstack/react-router';
import { routeTree } from './routeTree.gen.ts';

const router = createRouter({
  routeTree,
  context: {
    auth: {
      isAuthenticated: () => useUserStore.getState().isAuthenticated(),
    },
  },
});
Sentry.init({
  dsn: 'https://fb7a9853fa49781ef802ebe56bb0a1f1@o4509556130578433.ingest.us.sentry.io/4509556317093888', // <-- Paste your DSN here
  integrations: [
    Sentry.tanstackRouterBrowserTracingIntegration(router),
    Sentry.breadcrumbsIntegration({
      console: true,
      dom: true,
      fetch: true,
      history: true,
      xhr: true,
    }),
    Sentry.consoleLoggingIntegration({ levels: ['log', 'error', 'warn'] }),

  ],

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
  sendDefaultPii: true,
  // Set an environment
  environment: process.env.NODE_ENV,
});
