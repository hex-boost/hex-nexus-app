import type { AccountType } from '@/types/types.ts';
import { useRiotAccount } from '@/hooks/useRiotAccount.ts';
import { cn } from '@/lib/utils.ts';

export function LeaverBusterDisplay({ account, compact = false }: {
  account: AccountType;
  compact?: boolean;
}) {
  const { getLeaverBusterInfo, getStatusConfig } = useRiotAccount({ account });
  const leaverInfo = getLeaverBusterInfo();
  const statusConfig = getStatusConfig(leaverInfo || undefined);
  // Define styling based on severity

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
