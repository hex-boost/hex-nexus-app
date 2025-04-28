import type { Price } from '@/types/price.ts';
import type { RankingType } from '@/types/types.ts';
import { CoinIcon } from '@/components/coin-icon.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';

type PriceDisplayProps = {
  isPriceLoading: boolean;
  price: Price;
  ranking: RankingType;
};

export function PriceDisplay({ isPriceLoading, price, ranking }: PriceDisplayProps) {
  return (
    <div className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
      <CoinIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
      {isPriceLoading
        ? (
            <Skeleton className="h-5 w-12" />
          )
        : (
            price?.league[(ranking.elo.charAt(0).toUpperCase() + ranking.elo.slice(1).toLowerCase()) || 'Unranked']
          )}
      <span className="text-[10px] text-muted-foreground">/1h</span>
    </div>
  );
}
