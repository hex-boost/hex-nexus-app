import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      Hello "/_protected"!
      <Outlet />

    </div>
  );
}
