import type { PremiumType } from '@/types/types';
import { cn } from '@/lib/utils';
import { AlertCircle, Calendar, CheckCircle2, Shield } from 'lucide-react';

type SubscriptionStatusProps = {
  className?: string;
  subscription: PremiumType;
};

export default function SubscriptionStatus({ className, subscription }: SubscriptionStatusProps) {
  // Example subscription data
  // const subscription = {
  //   tier: 'Premium',
  //   status: 'active',
  const features = [
    'Unlimited account rentals',
    'Priority customer support',
    'Exclusive high-tier accounts',
    'Discounted rental rates',
  ];

  // Calculate days remaining
  const expiryDate = new Date(subscription.expiresAt);
  const today = new Date();
  const daysRemaining = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  // Format expiry date
  const formattedExpiryDate = expiryDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className={cn('w-full', className)}>
      <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            {subscription.tier}
          </h3>
          <div
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium',
              subscription.isActive
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
            )}
          >
            {subscription.isActive
              ? (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active
                </div>
              )
              : (
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Expired
                </div>
              )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
          <div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Expires on</p>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {formattedExpiryDate}
              {' '}
              (
              {daysRemaining}
              {' '}
              days)
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100">Plan Features:</p>
        <ul className="space-y-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* <div className="grid grid-cols-2 gap-2"> */}
      {/*   <Button variant="outline" size="sm" className=""> */}
      {/*     Change Plan */}
      {/*   </Button> */}
      {/*   <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white"> */}
      {/*     Renew Subscription */}
      {/*   </Button> */}
      {/* </div> */}
    </div>
  );
}
