import { Route as rootRoute } from './routes/__root';
import { Route as ProtectedImport } from './routes/_protected';
import { Route as ProtectedAccountsIdImport } from './routes/_protected/accounts/$id';
import { Route as ProtectedAccountsIndexImport } from './routes/_protected/accounts/index';
import { Route as ProtectedDashboardIndexImport } from './routes/_protected/dashboard/index';
import { Route as ProtectedSubscriptionIndexImport } from './routes/_protected/subscription/index';
import { Route as IndexImport } from './routes/index';
import { Route as LoginImport } from './routes/login';

const LoginRoute = LoginImport.update({
  id: '/login',
  path: '/login',
  getParentRoute: () => rootRoute,
} as any);

const ProtectedRoute = ProtectedImport.update({
  id: '/_protected',
  getParentRoute: () => rootRoute,
} as any);

const IndexRoute = IndexImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRoute,
} as any);

const ProtectedSubscriptionIndexRoute = ProtectedSubscriptionIndexImport.update(
  {
    id: '/subscription/',
    path: '/subscription/',
    getParentRoute: () => ProtectedRoute,
  } as any,
);

const ProtectedDashboardIndexRoute = ProtectedDashboardIndexImport.update({
  id: '/dashboard/',
  path: '/dashboard/',
  getParentRoute: () => ProtectedRoute,
} as any);

const ProtectedAccountsIndexRoute = ProtectedAccountsIndexImport.update({
  id: '/accounts/',
  path: '/accounts/',
  getParentRoute: () => ProtectedRoute,
} as any);

const ProtectedAccountsIdRoute = ProtectedAccountsIdImport.update({
  id: '/accounts/$id',
  path: '/accounts/$id',
  getParentRoute: () => ProtectedRoute,
} as any);

declare module '@tanstack/react-router' {
  type FileRoutesByPath = {
    '/': {
      id: '/';
      path: '/';
      fullPath: '/';
      preLoaderRoute: typeof IndexImport;
      parentRoute: typeof rootRoute;
    };
    '/_protected': {
      id: '/_protected';
      path: '';
      fullPath: '';
      preLoaderRoute: typeof ProtectedImport;
      parentRoute: typeof rootRoute;
    };
    '/login': {
      id: '/login';
      path: '/login';
      fullPath: '/login';
      preLoaderRoute: typeof LoginImport;
      parentRoute: typeof rootRoute;
    };
    '/_protected/accounts/$id': {
      id: '/_protected/accounts/$id';
      path: '/accounts/$id';
      fullPath: '/accounts/$id';
      preLoaderRoute: typeof ProtectedAccountsIdImport;
      parentRoute: typeof ProtectedImport;
    };
    '/_protected/accounts/': {
      id: '/_protected/accounts/';
      path: '/accounts';
      fullPath: '/accounts';
      preLoaderRoute: typeof ProtectedAccountsIndexImport;
      parentRoute: typeof ProtectedImport;
    };
    '/_protected/dashboard/': {
      id: '/_protected/dashboard/';
      path: '/dashboard';
      fullPath: '/dashboard';
      preLoaderRoute: typeof ProtectedDashboardIndexImport;
      parentRoute: typeof ProtectedImport;
    };
    '/_protected/subscription/': {
      id: '/_protected/subscription/';
      path: '/subscription';
      fullPath: '/subscription';
      preLoaderRoute: typeof ProtectedSubscriptionIndexImport;
      parentRoute: typeof ProtectedImport;
    };
  };
}

type ProtectedRouteChildren = {
  ProtectedAccountsIdRoute: typeof ProtectedAccountsIdRoute;
  ProtectedAccountsIndexRoute: typeof ProtectedAccountsIndexRoute;
  ProtectedDashboardIndexRoute: typeof ProtectedDashboardIndexRoute;
  ProtectedSubscriptionIndexRoute: typeof ProtectedSubscriptionIndexRoute;
};

const ProtectedRouteChildren: ProtectedRouteChildren = {
  ProtectedAccountsIdRoute,
  ProtectedAccountsIndexRoute,
  ProtectedDashboardIndexRoute,
  ProtectedSubscriptionIndexRoute,
};

const ProtectedRouteWithChildren = ProtectedRoute._addFileChildren(
  ProtectedRouteChildren,
);

export type FileRoutesByFullPath = {
  '/': typeof IndexRoute;
  '': typeof ProtectedRouteWithChildren;
  '/login': typeof LoginRoute;
  '/accounts/$id': typeof ProtectedAccountsIdRoute;
  '/accounts': typeof ProtectedAccountsIndexRoute;
  '/dashboard': typeof ProtectedDashboardIndexRoute;
  '/subscription': typeof ProtectedSubscriptionIndexRoute;
};

export type FileRoutesByTo = {
  '/': typeof IndexRoute;
  '': typeof ProtectedRouteWithChildren;
  '/login': typeof LoginRoute;
  '/accounts/$id': typeof ProtectedAccountsIdRoute;
  '/accounts': typeof ProtectedAccountsIndexRoute;
  '/dashboard': typeof ProtectedDashboardIndexRoute;
  '/subscription': typeof ProtectedSubscriptionIndexRoute;
};

export type FileRoutesById = {
  '__root__': typeof rootRoute;
  '/': typeof IndexRoute;
  '/_protected': typeof ProtectedRouteWithChildren;
  '/login': typeof LoginRoute;
  '/_protected/accounts/$id': typeof ProtectedAccountsIdRoute;
  '/_protected/accounts/': typeof ProtectedAccountsIndexRoute;
  '/_protected/dashboard/': typeof ProtectedDashboardIndexRoute;
  '/_protected/subscription/': typeof ProtectedSubscriptionIndexRoute;
};

export type FileRouteTypes = {
  fileRoutesByFullPath: FileRoutesByFullPath;
  fullPaths:
    | '/'
    | ''
    | '/login'
    | '/accounts/$id'
    | '/accounts'
    | '/dashboard'
    | '/subscription';
  fileRoutesByTo: FileRoutesByTo;
  to:
    | '/'
    | ''
    | '/login'
    | '/accounts/$id'
    | '/accounts'
    | '/dashboard'
    | '/subscription';
  id:
    | '__root__'
    | '/'
    | '/_protected'
    | '/login'
    | '/_protected/accounts/$id'
    | '/_protected/accounts/'
    | '/_protected/dashboard/'
    | '/_protected/subscription/';
  fileRoutesById: FileRoutesById;
};

export type RootRouteChildren = {
  IndexRoute: typeof IndexRoute;
  ProtectedRoute: typeof ProtectedRouteWithChildren;
  LoginRoute: typeof LoginRoute;
};

const rootRouteChildren: RootRouteChildren = {
  IndexRoute,
  ProtectedRoute: ProtectedRouteWithChildren,
  LoginRoute,
};

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>();
