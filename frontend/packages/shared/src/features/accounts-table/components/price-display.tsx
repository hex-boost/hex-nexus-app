import type { TimeOptionWithPrice } from '@/features/accounts-table/hooks/useAccounts.tsx';
import { CoinIcon } from '@/components/coin-icon.tsx';

type PriceDisplayProps = {
  price: TimeOptionWithPrice[];
};
export function formatMilliseconds(ms: number): string {
  if (ms <= 0) {
    return '0m';
  }

  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    if (minutes > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}h`;
    }
    return `${hours}h`;
  }

  return `${minutes}m`;
}

export function PriceDisplay({ price }: PriceDisplayProps) {
  const firstPrice = price[0];
  return (
    <div className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
      <CoinIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
      {firstPrice.accountPrice}
      <span className="text-[10px] text-muted-foreground">
        /
        {formatMilliseconds(firstPrice.milliseconds)}
      </span>
    </div>
  );
}
