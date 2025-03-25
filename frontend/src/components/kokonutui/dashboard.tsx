import type { UserType } from '@/types/types';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Activity, CreditCard, Shield } from 'lucide-react';
import CurrentlyRentedAccounts from './currently-rented-accounts';
import LastRentedAccount from './last-rented-account';
import SubscriptionStatus from './subscription-status';

export default function Dashboard({ user }: { user: UserType }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-black/20 rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2 ">
            <Shield className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
            Subscription Status
          </h2>
          {user
            ? <SubscriptionStatus subscription={user.premium} />
            : <Skeleton className="h-40 w-full"></Skeleton>}
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

      <div className="bg-white dark:bg-black/20 rounded-xl p-6 border border-gray-200 dark:border-[#1F1F23]">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
          Transactions
        </h2>

        {/* <RecentTransactions transactions={user.transactions} /> */}
      </div>
    </div>
  );
}
