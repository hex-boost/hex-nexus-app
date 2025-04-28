import type { AccountType } from '@/types/types.ts';
import { useRiotAccount } from '@/hooks/useRiotAccount.ts';
import { cn } from '@/lib/utils.ts';
import { AlertCircle, AlertOctagon, AlertTriangle, Shield } from 'lucide-react';

export function LeaverBusterDisplay({ account, compact = false }: {
  account: AccountType;
  compact?: boolean;
}) {
  const { getLeaverBusterInfo } = useRiotAccount({ account });
  const leaverInfo = getLeaverBusterInfo();

  // Define styling based on severity
  const getStatusConfig = () => {
    if (!leaverInfo || !leaverInfo.hasRestriction) {
      return {
        Icon: Shield,
        color: 'bg-emerald-100 border border-emerald-900 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        label: 'No restrictions',
        description: 'This account has no active restrictions',
      };
    }

    if (leaverInfo.severity >= 3) {
      return {
        Icon: AlertOctagon,
        color: 'bg-red-100 dark:bg-red-900/30 border border-red-900 text-red-600 dark:text-red-400',
        label: 'High',
        description: leaverInfo.message,
      };
    }

    if (leaverInfo.severity >= 1) {
      return {
        Icon: AlertTriangle,
        color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 border border-amber-900 dark:text-amber-400',
        label: 'Medium',
        description: leaverInfo.message,
      };
    }

    return {
      Icon: AlertCircle,
      color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 border border-blue-900 dark:text-blue-400',
      label: 'Low',
      description: leaverInfo.message,
    };
  };

  const statusConfig = getStatusConfig();
  const LeaverIcon = statusConfig.Icon;

  return (
    <div className={cn('flex items-center gap-2 p-4 rounded-md', statusConfig.color)}>
      <LeaverIcon className="h-8 w-8" />
      <span className="text-base">
        {compact ? statusConfig.label : statusConfig.description}
      </span>
    </div>
  );
}
