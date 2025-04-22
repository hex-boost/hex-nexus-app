import type { UserType } from '@/types/types';
import FavoriteAccounts from '@/components/FavoriteAccounts.tsx';
import { Separator } from '@/components/ui/separator.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { Activity, Shield, Star } from 'lucide-react';
import CurrentlyRentedAccounts from './currently-rented-accounts';
import SubscriptionStatus from './subscription-status';

const SubscriptionStatusSkeleton = () => (
  <div className="flex flex-col gap-4">
    <div className="bg-zinc-50 dark:bg-white/[0.01] rounded-xl p-5 ">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-6 w-28 rounded-md" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <div className="flex items-center gap-2 mb-3">
        <Skeleton className="h-4 w-4 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-3 w-20 rounded-sm" />
          <Skeleton className="h-4 w-36 rounded-sm" />
        </div>
      </div>
    </div>

    <div className="space-y-2">
      <Skeleton className="h-4 w-28 rounded-sm" />
      <div className="space-y-2 ">
        {Array.from({ length: 4 }).fill(0).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="h-3.5 w-3.5 rounded-full" />
            <Skeleton className="h-3 w-full rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CurrentlyRentedAccountsSkeleton = () => (
  <div className="w-full flex h-full flex-col justify-between">
    <div className="space-y-3 mb-4">
      {Array.from({ length: 3 }).fill(0).map((_, i) => (
        <div key={i} className="px-4 py-3 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div>
              <Skeleton className="h-3 w-20 rounded-sm mb-1" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-2.5 w-28 rounded-sm" />
              </div>
            </div>
          </div>
          <div className="text-right flex flex-col items-end">
            <div className="flex items-center gap-1">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16 rounded-sm" />
            </div>
            <Skeleton className="h-2.5 w-20 rounded-sm mt-1" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function Dashboard({ user }: { user: UserType | null }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-black/20 rounded-xl border border-gray-200 dark:border-[#1F1F23]">
          <h2 className="text-xl px-6 pt-6   font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2 ">
            <Shield className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
            Subscription Status
          </h2>
          <Separator className="mb-4" />

          {
            !user
              ? (
                  <SubscriptionStatusSkeleton />
                )

              : <SubscriptionStatus subscription={user.premium} />
          }
        </div>

        <div
          className="bg-white dark:bg-black/20  pt-6 pb-4 flex flex-col items-start rounded-xl border border-gray-200 dark:border-[#1F1F23]"
        >
          <h2 className="text-xl px-6 font-bold text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
            <Activity className="w-4 h-4 text-zinc-900 dark:text-zinc-50" />
            Currently Rented Accounts
          </h2>
          <Separator className="mb-4" />

          {
            !user
              ? <CurrentlyRentedAccountsSkeleton />
              : <CurrentlyRentedAccounts accounts={user.rentedAccounts} />
          }
        </div>
        <div className="bg-white dark:bg-black/20 flex flex-col items-start rounded-xl border border-gray-200 dark:border-[#1F1F23]">
          <h2 className="text-xl font-bold w-full px-6 pt-6  text-gray-900 dark:text-white mb-4 text-left flex items-center gap-2">
            <Star className="w-4 h-4 text-zinc-900 dark:text-zinc-50 " />
            Favorite Accounts
          </h2>
          <Separator className="mb-4" />
          <div className="min-h-[300px] w-full overflow-hidden">
            <FavoriteAccounts user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}
