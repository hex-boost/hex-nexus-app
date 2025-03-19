import type { AccountType } from '@/types/types.ts';

import AccountDetails from '@/components/account-details.tsx';
import { Button } from '@/components/ui/button.tsx';
import { strapiClient } from '@/lib/strapi.ts';
import { createFileRoute, Link, useLoaderData, useParams } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';

// The component that will render when the route matches
export const Route = createFileRoute('/_protected/accounts/$id')({
  loader: async () => {
    // Fetch all accounts
    const res = await strapiClient.find<AccountType[]>('accounts/available');
    return res.data;
  },
  beforeLoad: ({ params }) => {
    if (!('id' in params)) {
      throw new Error('Invalid account ID');
    }
    // No longer checking for numeric IDs since documentIds are strings
  },
  component: AccountByID,
});

function AccountByID() {
  // Access the route parameters
  const { id } = useParams({ from: '/_protected/accounts/$id' });
  // Get accounts from loader data
  const accounts = useLoaderData({ from: '/_protected/accounts/$id' });

  // Find the specific account by documentId
  const account = accounts?.find(acc => acc.documentId === id) || null;

  if (!accounts) {
    return <div>Loading account details...</div>;
  }

  if (!account) {
    return <div>Account not found</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link to="/accounts" className="text-white hover:underline">
          <Button variant="outline" className="space-x-2">
            <ArrowLeftIcon />
            {' '}
            <span>
              Back to Accounts
            </span>
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
        {/* Pass the filtered account to the AccountInfoDisplay component */}
        <AccountDetails rentalOptions={[{ hours: 1, price: 500 }]} account={account} />

      </div>
    </div>
  );
}
