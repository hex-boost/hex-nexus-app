import type { ExtensionOption } from '../../../components/extend-rental.ts';
import { CoinIcon } from '@/components/coin-icon.tsx';
import { Button } from '@/components/ui/button.tsx';
import { usePrice } from '@/hooks/usePrice.ts';
import { cn } from '@/lib/utils.ts';
import React from 'react';

export function QuickExtendButtons({
  userCoins,
  onExtend,
  isExtending,
  rankElo,
  priceData,
}: {
  userCoins?: number;
  onExtend: (option: ExtensionOption, cost: number, seconds: number) => void;
  isExtending: boolean;
  rankElo?: string;
  priceData: any;
}) {
  const { getAccountPrice } = usePrice();

  // Get extension options based on rank
  const extensionOptions = getAccountPrice(priceData, rankElo);

  // Select only the first three options for quick extend
  const quickOptions = extensionOptions.slice(0, 3).map((option, index) => ({
    ...option,
    index,
    seconds: option.hours * 3600, // Convert hours to seconds
  }));

  return (
    <div className="grid grid-cols-3 gap-2">
      {quickOptions.map((option, idx) => (
        <Button
          style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}

          key={idx}
          variant="outline"
          size="sm"
          className={cn(
            'flex flex-col items-center gap-1 h-auto py-2',
            option.price > (userCoins || 0) ? 'opacity-50 cursor-not-allowed' : '',
          )}
          onClick={() => onExtend(option, option.price, option.seconds)}
          disabled={isExtending || option.price > (userCoins || 0)}
        >
          <span className="text-xs">
            +
            {option.hours}
            h
          </span>
          <div className="flex items-center gap-0.5 text-xs">
            <CoinIcon className="w-3 h-3 text-amber-400" />
            {option.price}
          </div>
        </Button>
      ))}
    </div>
  );
}
