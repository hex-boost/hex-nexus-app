import type { AccountType } from '@/types/types.ts';

import AccountDetails from '@/components/account-details.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton.tsx';
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

  // if (!account && !isLoading) {
  //   return <div>Account not found</div>;
  // }

  return (
    <>
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
        {isLoading || !account ? (
          <div className="grid grid-cols-5 gap-6">
            <div className="col-span-3 grid grid-flow-row w-full space-y-6">
              <Card>
                <CardHeader>
                  <div className="w-full flex justify-between gap-4">
                    <Skeleton className="h-14 w-40" />
                    <Skeleton className="h-14 w-14" />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 ">
                  <div className="flex gap-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>

                  <div className="flex gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <div className="flex gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>

                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="w-full flex justify-between gap-6">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </CardHeader>
                <CardContent>

                  <Skeleton className="h-10 w-full mb-6" />
                  <div className="grid grid-cols-7 gap-4 ">
                    {
                      Array.from({ length: 21 }).map((_, i) => (
                        <Skeleton key={i} className="h-12  w-12" />
                      ))
                    }
                  </div>

                </CardContent>
              </Card>
            </div>

            <div className="col-span-2 space-y-6">
              {/* Security panel skeleton */}
              <Card>
                <CardHeader>
                  <Skeleton className="h-14 w-60" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-14 w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>

            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <AccountDetails
              price={price}
              account={account}
              onAccountChange={refetchAccount}
            />
          </div>
        )}
      </div>
    </>
  );
}
