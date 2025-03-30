// frontend/src/routes/_protected/_layout.tsx
import { createFileRoute, Link, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/_layout')({
  component: ProtectedLayout,
});

function ProtectedLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar de navegação */}
      <aside className="w-64 bg-gray-100 p-4">
        <nav className="space-y-2">
          <Link
            to="/_protected/dashboard"
            activeProps={{ className: 'font-bold' }}
            className="block p-2 hover:bg-gray-200 rounded"
          >
            Dashboard
          </Link>
          <Link
            to="/_protected/accounts"
            activeProps={{ className: 'font-bold' }}
            className="block p-2 hover:bg-gray-200 rounded"
          >
            Contas
          </Link>
          <Link
            to="/_protected/subscription"
            activeProps={{ className: 'font-bold' }}
            className="block p-2 hover:bg-gray-200 rounded"
          >
            Assinatura
          </Link>
        </nav>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
