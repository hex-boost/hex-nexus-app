// frontend/packages/shared/src/lib/champion-skin-store.ts
import {openDB} from 'idb';

const SKIN_DB_NAME = 'nexus_champion_skins';
const SKIN_STORE_NAME = 'skin_selections';
const SKIN_DB_VERSION = 1;

export type ChampionSkinSelection = {
  championId: number;
  skinNum: number;
  chromaId: number | null;
  timestamp: number;
};

export async function getSkinDB() {
  return openDB(SKIN_DB_NAME, SKIN_DB_VERSION, {
    upgrade(db) {
      db.createObjectStore(SKIN_STORE_NAME, { keyPath: 'championId' });
    },
  });
}

export async function saveSkinSelection(selection: ChampionSkinSelection) {
  const db = await getSkinDB();
  const tx = db.transaction(SKIN_STORE_NAME, 'readwrite');
  await tx.store.put(selection);
  await tx.done;
}

export async function getSkinSelections(): Promise<ChampionSkinSelection[]> {
  const db = await getSkinDB();
  const tx = db.transaction(SKIN_STORE_NAME, 'readonly');
  return tx.store.getAll();
}

export async function clearSkinSelections() {
  const db = await getSkinDB();
  const tx = db.transaction(SKIN_STORE_NAME, 'readwrite');
  await tx.store.clear();
  await tx.done;
}
