import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/accounts/')({
  component: Accounts,
});
