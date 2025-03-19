import type { ChampionById, DDragonChampionsData } from '@/types/ddragon.ts';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

export function useAllDataDragon(enabled = true) {
  // Get latest Data Dragon version
  const versionQuery = useQuery({
    queryKey: ['ddragon-version'],
    queryFn: async () => {
      const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
      const versions = await response.json() as string[];
      return versions[0]; // Latest version
    },
    enabled,
  });

  // Get champions data
  const championsQuery = useQuery({
    queryKey: ['champions', versionQuery.data],
    queryFn: async () => {
      const response = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${versionQuery.data}/data/en_US/champion.json`,
      );
      const data = await response.json() as DDragonChampionsData;
      return data.data;
    },
    enabled: !!versionQuery.data,
  });

  // Get all champions processed data
  const allChampions = useMemo(() => {
    if (versionQuery.isLoading || championsQuery.isLoading || !championsQuery.data) {
      return [];
    }

    const version = versionQuery.data;
    const championsData = championsQuery.data;

    return Object.values(championsData).map(champion => ({
      id: champion.key,
      name: champion.name,
      title: champion.title,
      imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image.full}`,
    }));
  }, [versionQuery.data, championsQuery.data]);

  // Fetch all champion details for complete skin data
  const allChampionDetailsQuery = useQuery({
    queryKey: ['all-champion-details', versionQuery.data],
    queryFn: async () => {
      if (!versionQuery.data || !championsQuery.data) {
        return [];
      }

      const version = versionQuery.data;
      const championsData = championsQuery.data;
      const championsArray = Object.values(championsData);

      // Fetch each champion's detailed data
      const detailPromises = championsArray.map(async (champion) => {
        const response = await fetch(
          `https://ddragon.leagueoflegends.com/cdn/${version}/data/en_US/champion/${champion.id}.json`,
        );
        const data = await response.json() as ChampionById;
        return data.data[champion.id];
      });

      return Promise.all(detailPromises);
    },
    enabled: !!versionQuery.data && !!championsQuery.data,
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

  // Get all skins
  const allSkins = useMemo(() => {
    if (versionQuery.isLoading || !versionQuery.data || allChampionDetailsQuery.isLoading) {
      return [];
    }

    const championDetails = allChampionDetailsQuery.data;
    if (!championDetails) {
      return [];
    }

    return championDetails.flatMap((champion) => {
      if (!champion || !champion.skins) {
        return [];
      }

      return champion.skins.map(skin => ({
        id: Number.parseInt(skin.id),
        name: skin.name || 'Default',
        champion: champion.name,
        imageAvatarUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champion.id}_${skin.num}.jpg`,
        rarity: determineRarity(skin),
        imageUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_${skin.num}.jpg`,
      }));
    });
  }, [versionQuery.data, allChampionDetailsQuery.data]);

  return {
    allChampions,
    allSkins,
    version: versionQuery.data,
    rawChampionsData: championsQuery.data,
    rawChampionDetails: allChampionDetailsQuery.data,
    isLoading: versionQuery.isLoading || championsQuery.isLoading || allChampionDetailsQuery.isLoading,
    error: versionQuery.error || championsQuery.error || allChampionDetailsQuery.error,
  };
}
