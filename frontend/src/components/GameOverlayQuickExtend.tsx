'use client';

import type { ExtensionOption } from './extend-rental';
import { Button } from '@/components/ui/button';
import { canExtendRental, EXTENSION_OPTIONS } from './extend-rental';

type QuickExtendButtonsProps = {
  userCoins: number;
  onExtend: (option: ExtensionOption, cost: number, seconds: number) => void;
  compact?: boolean;
};

export function QuickExtendButtons({ userCoins, onExtend, compact = false }: QuickExtendButtonsProps) {
  const handleExtend = (option: ExtensionOption) => {
    const { cost, seconds } = EXTENSION_OPTIONS[option];
    if (canExtendRental(option, userCoins)) {
      onExtend(option, cost, seconds);
    }
  };

  return (
    <div className={`grid grid-cols-3 gap-${compact ? '1' : '1.5'}`}>
      {(Object.keys(EXTENSION_OPTIONS) as ExtensionOption[]).map((option) => {
        const { cost } = EXTENSION_OPTIONS[option];
        const canAfford = canExtendRental(option, userCoins);

        return (
          <Button
            key={option}
            size="sm"
            variant="outline"
            disabled={!canAfford}
            onClick={() => handleExtend(option)}
            className={`
              ${compact ? 'h-5 px-1 text-[10px] py-0' : 'h-7 px-1.5 text-xs'} 
              ${
          canAfford
            ? 'bg-blue-950/30 border-blue-800/50 hover:bg-blue-900/50'
            : 'bg-zinc-900/30 border-zinc-800/50 text-zinc-500'
          }
            `}
          >
            <div className="flex flex-col items-center">
              <span>{option}</span>
              <span
                className={`${compact ? 'text-[8px]' : 'text-[10px]'} ${canAfford ? 'text-amber-400' : 'text-zinc-500'}`}
              >
                {cost}
                {' '}
                ⦿
              </span>
            </div>
          </Button>
        );
      })}
    </div>
  );
}
