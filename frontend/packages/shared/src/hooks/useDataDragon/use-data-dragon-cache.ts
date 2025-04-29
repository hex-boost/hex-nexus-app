import {openDB} from 'idb';

const CACHE_DB_NAME = 'nexus_ddragon_cache';
export const CACHE_STORE_NAME = 'cache_store';
const CACHE_VERSION = 1;

// Single cache entry that includes both data and version
type CachedItem<T> = {
  data: T;
  version: string;
  timestamp: number; // Adding timestamp for potential cache expiration
};

export async function getDB() {
  return openDB(CACHE_DB_NAME, CACHE_VERSION, {
    upgrade(db) {
      db.createObjectStore(CACHE_STORE_NAME);
    },
  });
}

export async function saveChampionDetails<T>(data: T, version: string) {
  const db = await getDB();
  const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
  await tx.store.put({
    data,
    version,
    timestamp: Date.now(),
  }, 'champion_details');
  await tx.done;
}

export async function getChampionDetails<T>(): Promise<{ data: T; version: string } | null> {
  const db = await getDB();
  const tx = db.transaction(CACHE_STORE_NAME, 'readonly');
  const cached = await tx.store.get('champion_details') as CachedItem<T> | undefined;

  if (cached) {
    return {
      data: cached.data,
      version: cached.version,
    };
  }

  return null;
}

export async function getCurrentVersion(): Promise<string | null> {
  const cache = await getChampionDetails<any>();
  return cache ? cache.version : null;
}

export async function clearCache() {
  const db = await getDB();
  const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
}
