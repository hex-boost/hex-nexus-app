import type { AccountType } from '@/types/types.ts';
import { useQueries, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useDataDragon({
  account,
  championsSearch,
  skinsSearch,
}: {
  account: AccountType;
  championsSearch: string;
  skinsSearch: string;
}) {
  // Get latest Data Dragon version
  const versionQuery = useQuery({
    queryKey: ['ddragon-version'],
    queryFn: async () => {
      const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
      const versions = await response.json();
      return versions[0]; // Latest version
    },
  });

  // Get champions data
  const championsQuery = useQuery({
    queryKey: ['champions', versionQuery.data],
    queryFn: async () => {
      const response = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${versionQuery.data}/data/en_US/champion.json`,
      );
      const data = await response.json();
      return data.data;
    },
    enabled: !!versionQuery.data,
  });

  // Filter champions based on account data and search term
  const filteredChampions = useMemo(() => {
    if (versionQuery.isLoading || championsQuery.isLoading || !championsQuery.data) {
      return [];
    }

    const version = versionQuery.data;
    const championsData = championsQuery.data;

    return account.LCUchampions
      .map((championId) => {
        // Find champion by ID in Data Dragon
        const championInfo = Object.values(championsData).find(
          (c: any) => c.key === championId.toString(),
        );

        if (!championInfo) {
          return null;
        }

        return {
          id: championId,
          name: championInfo.name,
          title: championInfo.title,
          imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championInfo.image.full}`,
        };
      })
      .filter(champion =>
        champion && champion.name.toLowerCase().includes(championsSearch.toLowerCase()),
      );
  }, [account.LCUchampions, championsSearch, versionQuery.data, championsQuery.data]);

  // Pre-calculate champion IDs needed for skins
  const neededChampionIds = useMemo(() => {
    if (!account.LCUskins.length) {
      return [];
    }

    // Extract champion IDs from skin IDs using the Math.floor(skinId / 1000) logic
    return Array.from(new Set(
      account.LCUskins.map(skinId => Math.floor(skinId / 1000).toString()),
    ));
  }, [account.LCUskins]);

  // Fetch all needed champion details in parallel
  const championDetailsQueries = useQueries({
    queries: (!!versionQuery.data && neededChampionIds.length > 0)
      ? neededChampionIds.map((championId) => {
          return {
            queryKey: ['champion-details', championId, versionQuery.data],
            queryFn: async () => {
              // First find champion key/id mapping
              const championsResponse = await fetch(
                `https://ddragon.leagueoflegends.com/cdn/${versionQuery.data}/data/en_US/champion.json`,
              );
              const championsData = await championsResponse.json();

              // Find champion name from key
              const championEntry = Object.values(championsData.data).find(
                (c: any) => c.key === championId,
              );

              if (!championEntry) {
                return null;
              }

              // Get detailed champion data including skins
              const response = await fetch(
                `https://ddragon.leagueoflegends.com/cdn/${versionQuery.data}/data/en_US/champion/${(championEntry as any).id}.json`,
              );
              const data = await response.json();
              return {
                championId,
                data: data.data[(championEntry as any).id],
              };
            },
            enabled: !!versionQuery.data,
          };
        })
      : [],
  });

  const determineRarity = (skin: any): string => {
    if (skin.name.includes('Ultimate')) {
      return 'Ultimate';
    }
    if (skin.name.includes('Legendary')) {
      return 'Legendary';
    }
    if (skin.name.includes('Epic')) {
      return 'Epic';
    }
    return 'Common';
  };

  // Filter skins based on account data and search term
  const filteredSkins = useMemo(() => {
    if (versionQuery.isLoading || !versionQuery.data || !account.LCUskins.length) {
      return [];
    }

    // Check if all champion details queries are done loading
    const isLoadingChampionDetails = championDetailsQueries.some(query => query.isLoading);
    if (isLoadingChampionDetails) {
      return [];
    }

    // Create a map of champion ID to champion data for easy lookup
    const championDetailsMap = new Map();
    championDetailsQueries.forEach((query) => {
      if (query.data) {
        championDetailsMap.set(query.data.championId, query.data.data);
      }
    });

    const skinsData = account.LCUskins.map((skinId) => {
      const championId = Math.floor(skinId / 1000).toString();
      const championData = championDetailsMap.get(championId);

      if (!championData) {
        return null;
      }

      const skin = championData.skins?.find((s: any) => s.id === skinId.toString());
      if (!skin) {
        return null;
      }

      return {
        id: skinId,
        name: skin.name || 'Default',
        champion: championData.name,
        rarity: determineRarity(skin),
        imageUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${championData.id}_${skin.num}.jpg`,
      };
    }).filter(Boolean);

    return skinsData.filter(skin =>
      skin && (
        skin.name.toLowerCase().includes(skinsSearch.toLowerCase())
        || skin.champion.toLowerCase().includes(skinsSearch.toLowerCase())
      ),
    );
  }, [account.LCUskins, skinsSearch, versionQuery.data, championDetailsQueries]);

  return {
    filteredChampions,
    filteredSkins,
    isLoading: versionQuery.isLoading || championsQuery.isLoading
      || championDetailsQueries.some(query => query.isLoading),
    error: versionQuery.error || championsQuery.error
      || championDetailsQueries.find(query => query.error)?.error,
  };
}
