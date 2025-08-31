import { NoPayments } from '@/components/empty-states.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { usePaymentsQuery } from '@/features/payment/hooks/usePayments.ts';
import { cn } from '@/lib/utils.ts';
import { Link, useNavigate } from '@tanstack/react-router'; // 1. Import useNavigate
import { ArrowRight, ArrowUpRight, CreditCard } from 'lucide-react';

const formatCurrency = (amount: number) => {
  return `$${(amount / 100).toFixed(2)}`;
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getGatewayDisplayName = (gateway: string) => {
  switch (gateway.toLowerCase()) {
    case 'stripe':
      return 'Stripe';
    case 'mercadopago':
      return 'Mercado Pago';
    case 'transfer':
      return 'Bank Transfer';
    case 'boostroyal':
      return 'Boost Royal';
    case 'turboboost':
      return 'Turbo Boost';
    case 'manual':
      return 'Manual';
    default:
      return gateway.charAt(0).toUpperCase() + gateway.slice(1);
  }
};

const RecentPaymentsSkeleton = () => (
  <div className="flex-1 px-6 py-2 space-y-1 overflow-y-auto">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="group flex items-center gap-3 p-2 rounded-lg">
        <Skeleton className="h-8 w-8 rounded-lg" />
        <div className="flex-1 flex items-center justify-between min-w-0">
          <div className="space-y-1">
            <Skeleton className="h-3 w-28 rounded-sm" />
            <Skeleton className="h-2.5 w-36 rounded-sm" />
          </div>
          <div className="text-right">
            <Skeleton className="h-3 w-16 rounded-sm" />
            <Skeleton className="h-2.5 w-12 rounded-sm mt-1" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

export default function RecentPayments() {
  const { data: paymentsData, isLoading, error } = usePaymentsQuery();
  const navigate = useNavigate(); // 2. Instantiate the navigate function

  const renderViewAllLink = () => (
    <Link
      to="/payments"
      className="block w-full py-2 text-sm text-muted-foreground hover:text-foreground bg-background hover:bg-gray-100 dark:hover:bg-background/95 justify-center rounded-bl-xl rounded-br-xl transition-colors border-t border-gray-200 dark:border-[#1F1F23]"
    >
      <div className="flex justify-center items-center">
        <span>View All Payments</span>
        <ArrowRight className="w-3.5 h-3.5 ml-1" />
      </div>
    </Link>
  );

  if (isLoading) {
    return (
      <div className="w-full flex flex-col h-full">
        <RecentPaymentsSkeleton />
        {/* {renderViewAllLink()} */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center p-6 text-sm text-red-600">
          Failed to load recent payments.
        </div>
        {/* {renderViewAllLink()} */}
      </div>
    );
  }

  const allPayments = [
    ...(paymentsData?.paidPayments ?? []),
    ...(paymentsData?.openPayments ?? []),
    ...(paymentsData?.canceledPayments ?? []),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const recentPayments = allPayments.slice(0, 3);

  if (recentPayments.length === 0) {
    return (
      <div className="w-full flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <NoPayments />
        </div>
        {/* {renderViewAllLink()} */}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex-1 px-6 py-2 space-y-1 overflow-y-auto">
        {recentPayments.map(payment => (
          // 3. Replace <Link> with <button>
          <button
            type="button" // Important for preventing form submissions
            key={payment.documentId}
            onClick={() => navigate({ to: `/payments/${payment.documentId}` })} // 4. Add onClick handler
            className={cn(
              'group flex items-center gap-3 w-full text-left', // 5. Kept styles, added w-full and text-left for button defaults
              'p-2 rounded-lg',
              'hover:bg-zinc-100 dark:hover:bg-zinc-800/50',
              'transition-all duration-200',
              'cursor-pointer',
            )}
          >
            <div
              className={cn(
                'p-2 rounded-lg',
                'bg-zinc-100 dark:bg-zinc-800',
                'border border-zinc-200 dark:border-zinc-700',
              )}
            >
              <CreditCard className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
            </div>

            <div className="flex-1 flex items-center justify-between min-w-0">
              <div className="space-y-0.5">
                <h3 className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {payment.desiredPlan?.name ?? 'Subscription'}
                  {' '}
                  Plan
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{formatDate(payment.createdAt)}</p>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-500">•</span>
                  <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
                    {payment.desiredMonths}
                    {' '}
                    month
                    {payment.desiredMonths > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 pl-3">
                <div className="text-right">
                  <span
                    className={cn(
                      'text-xs font-medium block',
                      'text-red-600 dark:text-red-400',
                    )}
                  >
                    -
                    {' '}
                    {formatCurrency(payment.price)}
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-500 capitalize">
                    {getGatewayDisplayName(payment.gateway)}
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </button>
        ))}
      </div>
      {renderViewAllLink()}
    </div>
  );
}
