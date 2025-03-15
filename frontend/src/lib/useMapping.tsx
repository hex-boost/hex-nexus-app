import { LolIcon, ValorantIcon } from './icons';

export function useMapping() {
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
  const getGameIcon = (game: 'lol' | 'valorant', props?: { size?: number; className?: string }) => {
    if (game === 'lol') {
      return <LolIcon {...props} />;
    } else {
      return <ValorantIcon />;
    }
  };
  return {
    getRankColor,
    getGameIcon,

  };
}
