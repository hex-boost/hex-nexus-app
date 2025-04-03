import { Button } from '@/components/ui/button';
import { useMapping } from '@/lib/useMapping';
import { CoinsIcon as CoinIcon } from 'lucide-react';
import { Badge } from '../ui/badge';

export default function LastRentedAccount() {
  const { getRankColor, getGameIcon } = useMapping();
  const lastAccount = {
    id: 'L4X92C',
    game: 'lol',
    tier: 'Diamond',
    rank: 'III',
    rentedAt: '2024-03-15T14:20:00Z',
    rentalDuration: 6, 
    champions: 152,
    skins: 93,
    cost: 2800,
  };
  const formatRentalTime = (hours: number) => {
    if (hours < 24) {
      return `${hours} hours`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`;
    }
  };

  return (
    <div className="rounded-xl p-4 flex items-center">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2">

          {getGameIcon(lastAccount.game as 'lol' | 'valorant', { size: 32, className: 'text-blue-300 w-6 h-6' })}
          <span className="text-sm font-medium">
            #
            {lastAccount.id}
          </span>
        </div>

        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700"></div>

        <div>
          <span className={`text-sm font-medium ${getRankColor(lastAccount.tier)}`}>
            {lastAccount.tier}
            {' '}
            {lastAccount.rank}
          </span>
        </div>

        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700"></div>
        <Badge>Available</Badge>
        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700"></div>

        <div className="flex items-center gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Champions:</span>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{lastAccount.champions}</span>
        </div>

        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700"></div>

        <div className="flex items-center gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Skins:</span>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{lastAccount.skins}</span>
        </div>

        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700"></div>

        <div className="flex items-center gap-1">
          <span className="text-sm text-zinc-600 dark:text-zinc-400">Duration:</span>
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {formatRentalTime(lastAccount.rentalDuration)}
          </span>
        </div>

        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-700"></div>

        <div className="flex items-center gap-1">
          <CoinIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{lastAccount.cost}</span>
        </div>
      </div>

      <Button size="lg" className="bg-blue-600 hover:bg-blue-700 py-2 text-white ml-4">
        Rent Again
      </Button>
    </div>
  );
}
