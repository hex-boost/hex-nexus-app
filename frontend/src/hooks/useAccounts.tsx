import type { AccountType, RankingType } from '@/types/types';
import { strapiClient } from '@/lib/strapi.ts';
import { useMapping } from '@/lib/useMapping';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';

export function getLeaverBusterInfo(account: AccountType) {
  if (!account.leaverBuster?.leaverBusterEntryDto) {
    return null;
  }

  const leaverData = account.leaverBuster.leaverBusterEntryDto;
  const penaltyData = leaverData.leaverPenalty;

  const hasActivePenalties
        = penaltyData?.hasActivePenalty === true
          || leaverData.punishedGamesRemaining > 0
          || (penaltyData?.rankRestricted === true && penaltyData?.rankRestrictedGamesRemaining > 0);

  if (hasActivePenalties) {
    const waitTimeMinutes = penaltyData?.delayTime ? Math.floor(penaltyData.delayTime / 60000) : 0;

    let message = '';

    // Low Priority Queue (most important info for boosters)
    if (leaverData.punishedGamesRemaining > 0) {
      message += `${waitTimeMinutes}min queue × ${leaverData.punishedGamesRemaining} games`;
    }

    // Ranked restrictions (also important)
    if (penaltyData?.rankRestricted && penaltyData?.rankRestrictedGamesRemaining > 0) {
      if (message) {
        message += ' • ';
      }
      message += `Ranked restricted: ${penaltyData.rankRestrictedGamesRemaining} games`;
    }

    return {
      hasRestriction: true,
      severity: leaverData.leaverLevel,
      message,
    };
  }

  return null; // No active penalties
}
type SortKey = keyof AccountType | 'coin_price' | 'winrate';

export function useAccounts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    leaverStatus: [] as string[],
    game: '',
    division: '',
    rank: '',
    region: '',
    company: '',
    status: '',
    selectedChampions: [] as string[],
    selectedSkins: [] as string[],
  });

  const [sortConfig, setSortConfig] = useState<{
    key: SortKey | null;
    direction: 'ascending' | 'descending' | null;
  }>({
    key: null,
    direction: null,
  });

  const router = useRouter();
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await strapiClient.find<AccountType[]>('accounts/available');
      return res.data.filter((account) => {
        if (account.user) {
          return false;
        }
        if (account.ban === null) {
          return true;
        }

        if (!account.ban.restrictions || account.ban.restrictions.length === 0) {
          return true;
        }
        const restrictions = account.ban.restrictions;

        const hasInvalidCredentials = restrictions.some(r =>
          r.type === 'INVALID_CREDENTIALS' || r.type === 'MFA_REQUIRED',
        );
        if (hasInvalidCredentials) {
          return false;
        }

        const hasPermanentBan = restrictions.some(r =>
          r.type === 'PERMANENT_BAN'
          && (r.scope === 'riot' || r.scope === 'lol' || !r.scope),
        );
        return !hasPermanentBan;
      });
    },
  });

  const { getRankColor, getEloIcon, getRegionIcon, getGameIcon } = useMapping();

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' | null = 'ascending';

    if (sortConfig.key === key) {
      if (sortConfig.direction === 'ascending') {
        direction = 'descending';
      } else if (sortConfig.direction === 'descending') {
        setSortConfig({ key: null, direction: null });
        return;
      }
    }

    setSortConfig({ key, direction });
  };

  const sortedAccounts = useMemo(() => {
    if (!accounts) {
      return [];
    }

    const sortableAccounts = [...accounts];

    if (sortConfig.key && sortConfig.direction) {
      sortableAccounts.sort((a, b) => {
        if (sortConfig.key === 'LCUchampions' || sortConfig.key === 'LCUskins') {
          const aArray = a[sortConfig.key as keyof AccountType] as unknown as any[] || [];
          const bArray = b[sortConfig.key as keyof AccountType] as unknown as any[] || [];

          const aLength = aArray?.length || 0;
          const bLength = bArray?.length || 0;

          return sortConfig.direction === 'ascending'
            ? aLength - bLength
            : bLength - aLength;
        }

        if (sortConfig.key === 'coin_price') {
          const aRank = a.rankings.find(r => r.queueType === 'soloqueue' && r.type === 'current')?.elo?.toLowerCase() || 'unranked';
          const bRank = b.rankings.find(r => r.queueType === 'soloqueue' && r.type === 'current')?.elo?.toLowerCase() || 'unranked';

          const rankValues: Record<string, number> = {
            challenger: 9,
            grandmaster: 8,
            master: 7,
            diamond: 6,
            platinum: 5,
            gold: 4,
            silver: 3,
            bronze: 2,
            iron: 1,
            unranked: 0,
          };

          const aValue = rankValues[aRank] || 0;
          const bValue = rankValues[bRank] || 0;

          return sortConfig.direction === 'ascending'
            ? aValue - bValue
            : bValue - aValue;
        }

        if (sortConfig.key === 'winrate') {
          const aRanking = a.rankings.find(r => r.queueType === 'soloqueue' && r.type === 'current');
          const bRanking = b.rankings.find(r => r.queueType === 'soloqueue' && r.type === 'current');

          const aTotalGames = (aRanking?.wins || 0) + (aRanking?.losses || 0);
          const bTotalGames = (bRanking?.wins || 0) + (bRanking?.losses || 0);

          const aWinRate = aTotalGames > 0 ? (aRanking?.wins || 0) / aTotalGames : 0;
          const bWinRate = bTotalGames > 0 ? (bRanking?.wins || 0) / bTotalGames : 0;

          return sortConfig.direction === 'ascending'
            ? aWinRate - bWinRate
            : bWinRate - aWinRate;
        }

        const aValue = a[sortConfig.key as keyof AccountType];
        const bValue = b[sortConfig.key as keyof AccountType];

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return sortableAccounts;
  }, [accounts, sortConfig]);

  const filteredAccounts = useMemo(() => {
    return sortedAccounts.filter((account) => {
      const soloqueueRanking = account.rankings.find(
        ranking => ranking.queueType === 'soloqueue' && ranking.type === 'current' && ranking.elo !== '',
      ) || account.rankings.find(
        ranking => ranking.queueType === 'soloqueue' && ranking.type === 'provisory',
      ) || {
        elo: '',
        division: '',
        points: 0,
        wins: 0,
        losses: 0,
      } as RankingType;

      if (searchQuery && !account.documentId.toString().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (filters.division && filters.division !== 'any'
        && (!soloqueueRanking || soloqueueRanking.division !== filters.division)) {
        return false;
      }

      if (filters.rank && filters.rank !== 'any'
        && (!soloqueueRanking || soloqueueRanking.elo?.toLowerCase() !== filters.rank.toLowerCase())) {
        return false;
      }
      if (filters.selectedChampions.length > 0) {
        const missingChampions = filters.selectedChampions.some(championId =>
          !account.LCUchampions.includes(Number.parseInt(championId)),
        );
        if (missingChampions) {
          return false;
        }
      }

      if (filters.selectedSkins.length > 0) {
        const missingSkins = filters.selectedSkins.some(skinId =>
          !account.LCUskins.includes(Number.parseInt(skinId)),
        );
        if (missingSkins) {
          return false;
        }
      }
      if (filters.region && filters.region !== 'any' && account.server !== filters.region) {
        return false;
      }

      if (filters.company && filters.company !== 'any' && account.type !== filters.company) {
        return false;
      }
      if (filters.leaverStatus && filters.leaverStatus.length > 0) {
        const leaverInfo = getLeaverBusterInfo(account);

        if (!leaverInfo && filters.leaverStatus.includes('none')) {
          return true;
        }
        if (!leaverInfo) {
          return false;
        }

        if (leaverInfo.severity >= 3 && filters.leaverStatus.includes('high')) {
          return true;
        }
        if (leaverInfo.severity >= 1 && leaverInfo.severity < 3 && filters.leaverStatus.includes('medium')) {
          return true;
        }
        if (leaverInfo.severity === 0 && filters.leaverStatus.includes('low')) {
          return true;
        }
        return false;
      }
      return true;
    });
  }, [sortedAccounts, searchQuery, filters]);

  const resetFilters = () => {
    setFilters({
      game: '',
      division: '',
      rank: '',
      region: '',
      company: '',
      status: '',
      selectedChampions: [],
      selectedSkins: [],
      leaverStatus: [],
    });
    setSearchQuery('');
    setSortConfig({ key: null, direction: null });
  };

  const SortIndicator = ({ column }: { column: SortKey }) => {
    if (sortConfig.key !== column || sortConfig.direction === null) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />;
    }

    return sortConfig.direction === 'ascending'
      ? <ArrowUp className="ml-1 h-4 w-4" />
      : <ArrowDown className="ml-1 h-4 w-4" />;
  };

  const handleViewAccountDetails = (accountId: string) => {
    router.navigate({ to: `/accounts/${accountId}` });
  };

  return {
    searchQuery,
    setSearchQuery,
    showFilters,
    setShowFilters,
    filters,
    setFilters,
    sortConfig,
    accounts,
    isLoading,
    getRankColor,
    getEloIcon,
    getRegionIcon,
    getGameIcon,
    sortedAccounts,
    filteredAccounts,
    requestSort,
    resetFilters,
    SortIndicator,
    handleViewAccountDetails,
  };
}
