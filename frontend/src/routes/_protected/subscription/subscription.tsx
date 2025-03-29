import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/subscription/subscription')({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_protected/subscription"!</div>;
}
