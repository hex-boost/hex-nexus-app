import {openDB} from "idb";

const CACHE_DB_NAME = 'nexus_ddragon_cache';
export const CACHE_STORE_NAME = 'cache_store';
const CACHE_VERSION = 1;
type CachedItem<T> = {
    data: T;
    version: string;
};

export async function getDB() {
    return openDB(CACHE_DB_NAME, CACHE_VERSION, {
        upgrade(db) {
            db.createObjectStore(CACHE_STORE_NAME);
        },
    });
}

export async function saveToCache<T>(key: string, data: T, version: string) {
    const db = await getDB();
    const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
    tx.store.put({data, version}, key);
    await tx.done;
}

export async function getFromCache<T>(key: string, currentVersion: string): Promise<T | null> {
    const db = await getDB();
    const tx = db.transaction(CACHE_STORE_NAME, 'readonly');
    const cached = await tx.store.get(key) as CachedItem<T> | undefined;

    if (cached && cached.version === currentVersion) {
        return cached.data;
    }

    return null;
}

export async function clearCache() {
    const db = await getDB();
    const tx = db.transaction(CACHE_STORE_NAME, 'readwrite');
    await tx.store.clear();
    await tx.done;
}