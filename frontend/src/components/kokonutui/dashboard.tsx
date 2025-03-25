import type { UserType } from '@/types/types';
import type { StrapiError } from 'strapi-ts-sdk/dist/infra/strapi-sdk/src';
import { strapiClient } from '@/lib/strapi';
import { useUserStore } from '@/stores/useUserStore';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Activity, Shield } from 'lucide-react';
import { useEffect } from 'react';
import CurrentlyRentedAccounts from './currently-rented-accounts';
import LastRentedAccount from './last-rented-account';
import SubscriptionStatus from './subscription-status';

export default function Dashboard() {
  const { logout } = useUserStore();
  const navigate = useNavigate();

  const { data: user, isLoading, isError, error } = useQuery<UserType, StrapiError>({
    queryKey: ['users', 'me'],

    queryFn: () => strapiClient.request<UserType>('get', 'users/me'),

  });

  useEffect(() => {
    if (isError && [401, 403].includes(error.error.status)) {
      logout();
      navigate({ to: '/login' });
    }
  }, [isError, error, logout, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>User not found</div>;
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
        <div
          className="bg-white dark:bg-black/20 flex flex-col items-start rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]"
        >
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
            Currently Rented Accounts
          </h2>
          <CurrentlyRentedAccounts accounts={user.rentedAccounts} />
        </div>
      </div>

      <div className="bg-zinc-50 dark:bg-black/20 rounded-xl  p-6 border border-gray-200 dark:border-[#1F1F23]">

        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2  ">
          Last Rented Account
        </h2>
        <LastRentedAccount />
      </div>

      {/* <div className="bg-white dark:bg-black/20 rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]"> */}
      {/*   <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2"> */}
      {/*     <CreditCard className="w-4 h-4 text-zinc-900 dark:text-zinc-50" /> */}
      {/*     Transactions */}
      {/*   </h2> */}
      {/**/}
      {/*   <RecentTransactions transactions={user.transactions} /> */}
      {/* </div> */}
    </div>
  );
}
