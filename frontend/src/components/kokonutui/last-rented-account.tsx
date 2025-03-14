'use client';

import { Button } from '@/components/ui/button';
import { CoinsIcon as CoinIcon } from 'lucide-react';

export default function LastRentedAccount() {
  // Example data for last rented account
  const lastAccount = {
    id: 'L4X92C',
    game: 'lol',
    tier: 'Diamond',
    rank: 'III',
    rentedAt: '2024-03-15T14:20:00Z',
    rentalDuration: 6, // hours
    champions: 152,
    skins: 93,
    cost: 2800,
  };

  // Format rental time
  const formatRentalTime = (hours: number) => {
    if (hours < 24) {
      return `${hours} hours`;
    } else {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days} days`;
    }
  };

  // Helper function to get rank color
  const getRankColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'iron':
      case 'bronze':
        return 'text-zinc-600 dark:text-zinc-400';
      case 'silver':
        return 'text-zinc-400 dark:text-zinc-300';
      case 'gold':
        return 'text-amber-500 dark:text-amber-400';
      case 'platinum':
        return 'text-cyan-500 dark:text-cyan-400';
      case 'diamond':
        return 'text-blue-500 dark:text-blue-400';
      case 'master':
        return 'text-purple-500 dark:text-purple-400';
      case 'grandmaster':
        return 'text-red-500 dark:text-red-400';
      case 'challenger':
        return 'text-yellow-500 dark:text-yellow-400';
      default:
        return 'text-zinc-600 dark:text-zinc-400';
    }
  };

  // Helper function to get game icon
  const getGameIcon = (game: 'lol' | 'valorant') => {
    if (game === 'lol') {
      return '/placeholder.svg?height=24&width=24&text=LoL';
    } else {
      return '/placeholder.svg?height=24&width=24&text=VAL';
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-zinc-800/30 rounded-xl p-4 flex items-center">
      <div className="flex items-center gap-4 flex-1">
        <div className="flex items-center gap-2">
          <img
            src={getGameIcon(lastAccount.game as 'lol' | 'valorant') || '/placeholder.svg'}
            alt={lastAccount.game === 'lol' ? 'League of Legends' : 'Valorant'}
            className="w-6 h-6"
          />
          <span className="text-sm font-medium">{lastAccount.id}</span>
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

      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white ml-4">
        Rent Again
      </Button>
    </div>
  );
}
