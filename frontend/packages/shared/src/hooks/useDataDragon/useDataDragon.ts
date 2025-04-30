import type {ChampionByID, ChampionById, DDragonChampionsData} from '@/hooks/useDataDragon/types/ddragon.ts';
import type {UseDataDragonHook} from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import {
    clearCache,
    getChampionDetails,
    getCurrentVersion,
    saveChampionDetails,
} from '@/hooks/useDataDragon/use-data-dragon-cache.ts';
import {useQuery} from '@tanstack/react-query';
import {useEffect, useMemo, useState} from 'react';

export function useAllDataDragon(): UseDataDragonHook {
  const [shouldFetch, setShouldFetch] = useState(false);

  useEffect(() => {
    const checkCache = async () => {
      try {
        // Check if version exists in cache
        const cachedVersion = await getCurrentVersion();
        if (cachedVersion) {
          // Cache exists, start fetching immediately
          setShouldFetch(true);
        } else {
          // No cache, delay the fetching
          setTimeout(() => {
            setShouldFetch(true);
          }, 2000);
        }
      } catch (error) {
        console.log(error);
        // If any error, just start fetching after delay
        setTimeout(() => setShouldFetch(true), 2000);
      }
    };

    checkCache();
  }, []);
  const versionQuery = useQuery({
    queryKey: ['ddragon-version'],
    queryFn: async () => {
      const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
      const versions = await response.json() as string[];
      const latestVersion = versions[0];

      const cachedVersion = await getCurrentVersion();
      if (cachedVersion && cachedVersion !== latestVersion) {
        await clearCache();
      }

      return latestVersion;
    },
    staleTime: 60 * 60 * 1000,
    enabled: shouldFetch,
  });
  const championsQuery = useQuery({
    queryKey: ['champions', versionQuery.data],
    queryFn: async () => {
      if (!versionQuery.data) {
        return null;
      }

      const currentVersion = versionQuery.data;
      const cached = await getChampionDetails<ChampionByID>();

      if (cached && cached.version === currentVersion) {
        // We have champion details which includes all champion data
        return cached.data;
      }

      const response = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/champion.json`,
      );
      const data = await response.json() as DDragonChampionsData;

      return data.data;
    },
    staleTime: Infinity,
    enabled: !!versionQuery.data,
  });

  const allChampionDetailsQuery = useQuery({
    queryKey: ['all-champion-details', versionQuery.data],
    queryFn: async () => {
      if (!versionQuery.data || !championsQuery.data) {
        return [];
      }

      const currentVersion = versionQuery.data;
      const cached = await getChampionDetails<ChampionByID[]>();

      if (cached && cached.version === currentVersion) {
        return cached.data;
      }

      const championsData = championsQuery.data;
      const championsArray = Object.values(championsData);

      const detailPromises = championsArray.map(async (champion) => {
        const response = await fetch(
          `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/champion/${champion.id}.json`,
        );
        const data = await response.json() as ChampionById;
        return data.data[champion.id];
      });

      const allDetails = await Promise.all(detailPromises);

      // Store all champion details in the single cache entry
      await saveChampionDetails(allDetails, currentVersion);

      return allDetails;
    },
    staleTime: Infinity,
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

  const allChampions = useMemo(() => {
    if (!versionQuery.data || !allChampionDetailsQuery.data) {
      return [];
    }

    const championDetails = allChampionDetailsQuery.data;
    if (!championDetails || championDetails.length === 0) {
      return [];
    }

    const version = versionQuery.data;
    return championDetails.map((champion: ChampionByID) => {
      // Transform raw skins into FormattedSkin objects
      const formattedSkins = champion.skins.map(skin => ({
        id: Number.parseInt(skin.id),
        name: skin.name || 'Default',
        champion: champion.name,
        num: skin.num,
        imageAvatarUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${champion.id}_${skin.num}.jpg`,
        rarity: determineRarity(skin),
        imageUrl: `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champion.id}_${skin.num}.jpg`,
      }));

      return {
        id: champion.key,
        name_id: champion.id,
        name: champion.name,
        title: champion.title,
        imageUrl: `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${champion.image.full}`,
        skins: formattedSkins,
      };
    });
  }, [versionQuery.data, allChampionDetailsQuery.data]);
  const allSkins = useMemo(() => {
    if (!versionQuery.data || !allChampionDetailsQuery.data) {
      return [];
    }

    const championDetails = allChampionDetailsQuery.data;
    if (!championDetails || championDetails.length === 0) {
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
        skin: skin.num,
        num: skin.num,
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
