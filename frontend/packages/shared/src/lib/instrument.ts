import * as Sentry from '@sentry/react';
import { createRouter } from '@tanstack/react-router';
import { UnleashClient } from 'unleash-proxy-client';
import { routeTree } from '../../../main/src/routeTree.gen.ts';
import { useUserStore } from '../stores/useUserStore.ts';

export const unleashClient = new UnleashClient({
  url: 'https://primary-production-8693.up.railway.app/api/frontend',
  clientKey: '*:production.825408eb4a39c1335a6a4c258a24fe77e93c547a38209badd5ee2f6a',
  appName: 'nexus-app',
  environment: 'production',
  context: {
    userId: useUserStore.getState().user?.id?.toString() || 'anonymous',
  },
  refreshInterval: 30, // seconds
});
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
  dsn: 'https://57f976075a4fde7d718f64a14383e365@o4509556130578433.ingest.us.sentry.io/4509585352097792',
  integrations: [
    Sentry.tanstackRouterBrowserTracingIntegration(router),
    Sentry.unleashIntegration({ featureFlagClientClass: UnleashClient }),

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
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  _experiments: { enableLogs: true },
  tracePropagationTargets: [import.meta.env.VITE_API_URL || 'http://localhost:1337', /^\/api\//],

  tracesSampleRate: 0, // Disable performance monitoring
  sendDefaultPii: true,
  environment: import.meta.env.VITE_NODE_ENV || 'development',
});
