// Main hook return type
import type {Champions, Image, Info, Stats} from '@/hooks/useDataDragon/types/ddragon.ts';

export type FormattedSkin = {
  id: number;
  name: string;
  champion: string;
  imageAvatarUrl: string;
  rarity: string; // Assuming determineRarity returns a string
  imageUrl: string;
  skinLine?: string;
  releaseDate?: string;
  chromas?: any[];
  webm?: string;
  model3d?: string;
};

export type FormattedChampion = {
  id: string;
  name: string;
  title: string;
  imageUrl: string;
  skins: FormattedSkin[];
};

export type UseDataDragonHook = {
  version?: string;
  isLoading: boolean;
  allChampions: FormattedChampion[];
  allSkins: FormattedSkin[];
  rawChampionsData: Record<string, any> | Champions | null | undefined;
  rawChampionDetails: any;
  error: Error | null;

};

// Base champion type that can be extended from the existing types
export type Champion = {
  version: string;
  id: string;
  key: string;
  name: string;
  title: string;
  blurb: string;
  info: Info;
  image: Image;
  tags: string[];
  partype: string;
  stats: Stats;
};

// Configuration options for the hook
export type DataDragonConfig = {
  initialVersion?: string;
  language?: string;
  baseUrl?: string;
  autoRefetch?: boolean;
};

// API response types
export type VersionsResponse = {
  versions: string[];
};

export type ChampionsResponse = {
  type: string;
  format: string;
  version: string;
  data: Record<string, Champion>;
};
