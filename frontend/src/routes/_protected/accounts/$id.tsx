import type { AccountType } from '@/types/types.ts';

import AccountDetails from '@/components/account-details.tsx';
import { Button } from '@/components/ui/button.tsx';
import { usePrice } from '@/hooks/usePrice.ts';
import { strapiClient } from '@/lib/strapi.ts';
import { useUserStore } from '@/stores/useUserStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';

// The component that will render when the route matches
export const Route = createFileRoute('/_protected/accounts/$id')({
  beforeLoad: ({ params }) => {
    if (!('id' in params)) {
      throw new Error('Invalid account ID');
    }
  },
  component: AccountByID,
});

function AccountByID() {
  const { id } = useParams({ from: '/_protected/accounts/$id' });
  const { price, isPriceLoading } = usePrice();
  const queryClient = useQueryClient();

  // Fetch available accounts
  const {
    data: availableAccounts,
    isLoading: isAvailableLoading,
  } = useQuery({
    queryKey: ['accounts', 'available'],
    queryFn: () => strapiClient.find<AccountType[]>('accounts/available').then(res => res.data),
  });

  // Fetch rented accounts
  const {
    data: rentedAccounts,
    isLoading: isRentedLoading,
  } = useQuery({
    queryKey: ['accounts', 'rented'],
    queryFn: () => strapiClient.find<AccountType[]>('accounts/rented').then(res => res.data),
  });

  // Fetch refund data if needed
  // Function to refetch both available and rented accounts data
  const refetchAccount = () => {
    // Invalidate queries to trigger refetching
    queryClient.invalidateQueries({ queryKey: ['accounts', 'available'] });
    queryClient.invalidateQueries({ queryKey: ['accounts', 'rented'] });
  };

  // Merge account data with rented account data taking precedence
  const account = availableAccounts?.find(acc => acc.documentId === id)
    || rentedAccounts?.find(acc => acc.documentId === id)
    || null;

  const { user } = useUserStore();

  const {
    data: refundData,
  } = useQuery({
    queryKey: ['accounts', 'refund', id],
    queryFn: () => strapiClient.find<{ amount: number }>(`accounts/${id}/refund`).then(res => res.data),
    enabled: !!account?.user && !!user && account.user.documentId === user.documentId,
    staleTime: 0,
  });
  const isLoading = isAvailableLoading || isRentedLoading || isPriceLoading;

  if (isLoading) {
    return <div>Loading account details...</div>;
  }

  if (!account) {
    return <div>Account not found</div>;
  }

  if (!price) {
    return <div>Price not found</div>;
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <Link to="/accounts" className="text-white hover:underline">
          <Button variant="outline" className="space-x-2">
            <ArrowLeftIcon />
            {' '}
            <span>Back to Accounts</span>
          </Button>
        </Link>
      </div>

      <div className="space-y-8">
        <AccountDetails
          dropRefund={refundData?.amount}
          price={price}
          account={account}
          onAccountChange={refetchAccount}
        />
      </div>
    </div>
  );
}
