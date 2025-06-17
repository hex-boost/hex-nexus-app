import { useSelectedChampionAndSkin } from '@/features/skin-selector/hooks/useSelectedChampionAndSkin.ts';

import { useAccountEvents } from '@/hooks/useAccountEvents.ts';
import { useChampionSkin } from '@/hooks/useChampionSkin.ts';
import { UseCurrentSummonerEvents } from '@/hooks/useCurrentSummonerEvents.ts';

export function useGoState() {
  useChampionSkin();
  UseCurrentSummonerEvents();
  useAccountEvents();
  const { selectedSkinAndChampion, defaultSkinId, isDefaultSkin } = useSelectedChampionAndSkin();
  return {
    selectedSkinAndChampion,
    defaultSkinId,
    isDefaultSkin,
  };
}
