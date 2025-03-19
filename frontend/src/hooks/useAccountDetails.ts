import type { AccountType } from '@/types/types.ts';
import { useCallback, useMemo, useState } from 'react';

type RentalOption = {
  hours: number;
  price: number;
};

export function useAccountDetails({
  account,
  rentalOptions,
}: {
  account: AccountType;
  rentalOptions: RentalOption[];
}) {
  // State management
  const [selectedRentalOption, setSelectedRentalOption] = useState<RentalOption>(
    rentalOptions[3] || rentalOptions[0],
  );
  const [championsSearch, setChampionsSearch] = useState('');
  const [skinsSearch, setSkinsSearch] = useState('');
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);

  const getSkinRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'Epic':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'Legendary':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
      case 'Ultimate':
        return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
      case 'Mythic':
        return 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400';
      default:
        return 'bg-zinc-100 dark:bg-zinc-900/30 text-zinc-600 dark:text-zinc-400';
    }
  };
  // Filtered data with memoization for performance
  const filteredChampions = useMemo(() =>
    account.LCUchampions.filter(champion =>
      champion,
      // champion.name.toLowerCase().includes(championsSearch.toLowerCase()),
    ), [account.LCUchampions, championsSearch]);

  const filteredSkins = useMemo(() =>
    account.LCUskins.filter(skin =>
      skin,
      // skin.name.toLowerCase().includes(skinsSearch.toLowerCase())
      // || skin.champion.toLowerCase().includes(skinsSearch.toLowerCase()),
    ), [account.LCUskins, skinsSearch]);

  // Handler functions
  const handleLoginToAccount = useCallback(() => {
    alert(`Logging in to ${'lol' === 'lol' ? 'League of Legends' : 'Valorant'} with account: ${account.id}`);
  }, [account.id]);

  const handleRentAccount = useCallback(() => {
    // Implementation to be added
  }, []);

  const handleDropAccount = useCallback(() => {
    setIsDropDialogOpen(false);
    // Additional implementation to be added
  }, []);

  return {
    // State
    selectedRentalOption,
    setSelectedRentalOption,
    championsSearch,
    setChampionsSearch,
    skinsSearch,
    setSkinsSearch,
    isDropDialogOpen,
    setIsDropDialogOpen,

    // Derived data
    filteredChampions,
    filteredSkins,

    getSkinRarityColor, // Handlers
    handleLoginToAccount,
    handleRentAccount,
    handleDropAccount,
  };
}
