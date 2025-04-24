import type { PremiumType } from '@/types/types';
import { useMembership } from '@/hooks/useMembership.ts';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore.ts';
import { AlertCircle, Calendar, CheckCircle2, Shield } from 'lucide-react';

type SubscriptionStatusProps = {
  className?: string;
  subscription?: PremiumType;
};

export default function SubscriptionStatus({ className, subscription }: SubscriptionStatusProps) {
  const { pricingPlans } = useMembership();
  const { user } = useUserStore();
  const hasValidExpiry = subscription?.expiresAt !== undefined;
  const expiryDate = hasValidExpiry ? new Date(subscription.expiresAt) : new Date();
  const today = new Date();
  const daysRemaining = hasValidExpiry
    ? Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const formattedExpiryDate = hasValidExpiry
    ? expiryDate.toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'N/A';
  function isSubscriptionActive(subscription?: PremiumType): boolean {
    if (!subscription?.expiresAt) {
      return false;
    }

    const expiryDate = new Date(subscription.expiresAt);
    const today = new Date();

    return expiryDate > today;
  }
  return (
    <div className={cn('w-full px-6 pb-6', className)}>
      <div className="bg-zinc-50 dark:bg-white/[0.01] rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2 capitalize">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            {subscription?.tier || 'Free'}
          </h3>
          <div
            className={cn('px-3 py-1 rounded-full text-xs font-medium', isSubscriptionActive(subscription) ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400')}
          >
            {

              isSubscriptionActive(subscription)
                ? (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Active
                    </div>
                  )
                : !subscription?.tier
                    ? (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          N/A
                        </div>
                      )
                    : (
                        <div className="flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          Expired
                        </div>
                      )
            }
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Expires on</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {isSubscriptionActive(subscription)
                ? (
                    <>
                      {formattedExpiryDate}
                      {' '}
                      {daysRemaining}
                      {' '}
                      days
                    </>
                  )
                : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 ">
        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Plan Features:</p>
        <ul className="space-y-1">
          {pricingPlans.find(plan => plan.tier_enum === user?.premium?.tier)?.benefits.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {feature.title}
            </li>
          ))}
        </ul>
      </div>

    </div>
  );
}
