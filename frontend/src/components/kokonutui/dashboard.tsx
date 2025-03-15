import type { UserType } from '@/types/types';
import type { StrapiRequestParams } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';
import { strapiClient } from '@/lib/strapi';
import { useQuery } from '@tanstack/react-query';
import { Activity, CreditCard, Shield } from 'lucide-react';
import CurrentlyRentedAccounts from './currently-rented-accounts';
import LastRentedAccount from './last-rented-account';
import RecentTransactions from './recent-transactions';
import SubscriptionStatus from './subscription-status';

export default function Dashboard() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', 'me'],

    queryFn: () => strapiClient.request<UserType>('get', 'users/me', {
      params: { populate: ['role', 'avatar', 'premium'] } as StrapiRequestParams,
    }),

  });
  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!user) {
    throw new Error('User not found');
  }
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-black/20 rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2 ">
            <Shield className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
            Subscription Status
          </h2>
          <SubscriptionStatus subscription={user.premium} />
        </div>
        <div className="bg-white dark:bg-black/20 flex flex-col items-start rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
            Currently Rented Accounts
          </h2>
          <CurrentlyRentedAccounts />
        </div>
      </div>

      <div className="bg-zinc-50 dark:bg-black/20 rounded-xl  p-6 border border-gray-200 dark:border-[#1F1F23]">

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2  ">
          Last Rented Account
        </h2>
        <LastRentedAccount />
      </div>

      <div className="bg-white dark:bg-black/20 rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
          Transactions
        </h2>
        <RecentTransactions />
      </div>
    </div>
  );
}
