import { AccountsTablePage } from '@/features/accounts-table/accounts-table.tsx';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/accounts/')({
  component: AccountsTablePage,
});
