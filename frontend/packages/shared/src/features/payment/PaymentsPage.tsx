import type { LucideIcon } from 'lucide-react';
import { NoPayments } from '@/components/empty-states.tsx';
import { usePaymentsQuery } from '@/features/payment/hooks/usePayments.ts';
import { cn } from '@/lib/utils';
import { useNavigate } from '@tanstack/react-router'; // 1. Import useNavigate
import { CheckCircle, Clock, CreditCard, ExternalLink, XCircle } from 'lucide-react';

// Mock data based on the provided schema

const getStatusIcon = (status: string): LucideIcon => {
  switch (status) {
    case 'paid':
      return CheckCircle;
    case 'pending':
      return Clock;
    case 'canceled':
      return XCircle;
    default:
      return Clock;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'text-emerald-600 dark:text-emerald-400';
    case 'pending':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'canceled':
      return 'text-red-600 dark:text-red-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

const formatCurrency = (amount: number) => {
  return `$${(amount / 100).toFixed(2)}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function PaymentsPage() {
  const { data: payments, isLoading, error } = usePaymentsQuery();
  const navigate = useNavigate(); // 2. Instantiate the navigate function

  if (isLoading) {
    return <div>Loading payments...</div>;
  }

  if (error) {
    return <div>Error loading payments.</div>;
  }

  // Fallback if payments is undefined
  const paymentsData = payments ?? { openPayments: [], canceledPayments: [], paidPayments: [] };

  const allPayments = [
    ...paymentsData.paidPayments,
    ...paymentsData.openPayments,
    ...paymentsData.canceledPayments,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (allPayments.length === 0) {
    return (
      <div className="flex items-center justify-center pt-16">
        <NoPayments />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-medium text-emerald-900 dark:text-emerald-100">Paid Payments</span>
          </div>
          <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100 mt-2">
            {payments?.paidPayments.length}
          </p>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-900 dark:text-yellow-100">Pending Payments</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-2">{payments?.openPayments.length}</p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <span className="text-sm font-medium text-red-900 dark:text-red-100">Canceled Payments</span>
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-2">{payments?.canceledPayments.length}</p>
        </div>
      </div>

      {/* Payments List */}
      <div className="space-y-2">
        {allPayments.map((payment) => {
          const StatusIcon = getStatusIcon(payment.paymentStatus);
          return (
          // 3. Replace <Link> with <button>
            <button
              type="button"
              key={payment.id}
              onClick={() => navigate({ to: `/payments/${payment.documentId}` })} // 4. Add onClick handler
              className={cn(
                'group !flex items-start gap-4 p-4 rounded-lg cursor-pointer block w-full text-left', // Added w-full and text-left
                'bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800',
                'hover:bg-zinc-50 dark:hover:bg-zinc-800/50',
                'transition-all duration-200 hover:shadow-sm',
              )}
            >
              <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <CreditCard className="w-4 h-4 text-zinc-900 dark:text-zinc-50 " />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      {payment.gateway}
                      <span className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 ml-3">
                        ID:
                        {payment.id}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                      {payment.desiredMonths}
                      {' '}
                      month
                      {payment.desiredMonths > 1 ? 's' : ''}
                      {' '}
                      {payment.desiredPlan?.name}
                      plan
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {formatCurrency(payment.price)}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <StatusIcon className={cn('w-3 h-3', getStatusColor(payment.paymentStatus))} />
                      <span className={cn('text-xs font-medium capitalize', getStatusColor(payment.paymentStatus))}>
                        {payment.paymentStatus}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDate(payment.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    {payment.metadata?.sessionUrl && (
                      <ExternalLink className="w-3 h-3 text-zinc-400 dark:text-zinc-500" />
                    )}
                    <span className="text-xs text-zinc-400 dark:text-zinc-500">View Details →</span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
