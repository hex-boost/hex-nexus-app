import type { ChampionById, DDragonChampionsData } from '@/types/ddragon.ts';
import { useQuery } from '@tanstack/react-query';
import { openDB } from 'idb';
import { useEffect, useMemo } from 'react';

const CACHE_DB_NAME = 'nexus_ddragon_cache';
const CACHE_STORE_NAME = 'cache_store';
const CACHE_VERSION = 1;

type CachedItem<T> = {
  data: T;
  version: string;
};

async function getDB() {
  return openDB(CACHE_DB_NAME, CACHE_VERSION, {
    upgrade(db) {
      db.createObjectStore(CACHE_STORE_NAME);
    },
  });
}

async function saveToCache<T>(key: string, data: T, version: string) {
  const db = await getDB();
  const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
  tx.store.put({ data, version }, key);
  await tx.done;
}

async function getFromCache<T>(key: string, currentVersion: string): Promise<T | null> {
  const db = await getDB();
  const tx = db.transaction(CACHE_STORE_NAME, 'readonly');
  const cached = await tx.store.get(key) as CachedItem<T> | undefined;

  if (cached && cached.version === currentVersion) {
    return cached.data;
  }

  return null;
}

async function clearCache() {
  const db = await getDB();
  const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
}

export function useAllDataDragon(enabled = true) {
  const versionQuery = useQuery({
    queryKey: ['ddragon-version'],
    queryFn: async () => {
      const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
      const versions = await response.json() as string[];
      const latestVersion = versions[0];

      const db = await getDB();
      const tx = db.transaction(CACHE_STORE_NAME, 'readonly');
      const cachedVersionItem = await tx.store.get('cached_version');
      const cachedVersion = cachedVersionItem?.version;

      if (cachedVersion && cachedVersion !== latestVersion) {
        await clearCache();
      }

      await saveToCache('cached_version', null, latestVersion);

      return latestVersion;
    },
    staleTime: 60 * 60 * 1000,
    enabled,
  });

  const championsQuery = useQuery({
    queryKey: ['champions', versionQuery.data],
    queryFn: async () => {
      if (!versionQuery.data) {
        return null;
      }

      const currentVersion = versionQuery.data;

      const cachedData = await getFromCache<Record<string, any>>('champions', currentVersion);
      if (cachedData) {
        return cachedData;
      }

      const response = await fetch(
        `https://ddragon.leagueoflegends.com/cdn/${currentVersion}/data/en_US/champion.json`,
      );
      const data = await response.json() as DDragonChampionsData;

      await saveToCache('champions', data.data, currentVersion);

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

      const cachedDetails = await getFromCache<any[]>('champion_details', currentVersion);
      if (cachedDetails) {
        return cachedDetails;
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

      await saveToCache('champion_details', allDetails, currentVersion);

      return allDetails;
    },
    staleTime: Infinity,
    enabled: !!versionQuery.data && !!championsQuery.data,
  });

  useEffect(() => {
    if (enabled && !versionQuery.data) {
      versionQuery.refetch();
    }
  }, [enabled]);

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
    if (!versionQuery.data || !championsQuery.data) {
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
