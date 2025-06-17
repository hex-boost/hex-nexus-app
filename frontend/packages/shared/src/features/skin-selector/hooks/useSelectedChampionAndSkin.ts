import { Events } from '@wailsio/runtime';
import { useEffect, useState } from 'react';

type SkinSelectorInfo = {
  championName: string;
  isSkinGrantedFromBoost: boolean;
  selectedChampionId: number;
  selectedSkinId: number;
  showSkinSelector: boolean;
  skinSelectionDisabled: boolean;
};
export function useSelectedChampionAndSkin() {
  const [selectedSkinAndChampion, setSelectedSkinAndChampion] = useState<SkinSelectorInfo | undefined>(undefined);
  const selectedChampionId = selectedSkinAndChampion?.selectedChampionId;
  const selectedSkinId = selectedSkinAndChampion?.selectedSkinId;
  useEffect(() => {
    const cancel = Events.On('OnJsonApiEvent_lol-champ-select_v1_skin-selector-info', (event) => {
      console.log('OnJsonApiEvent_lol-champ-select_v1_skin-selector-info', event.data[0]);
      setSelectedSkinAndChampion(event.data[0]);
    });

    return () => {
      cancel();
    };
  });
  const defaultSkinId = (selectedChampionId || 0) * 1000;

  const isDefaultSkin = (selectedChampionId !== 0 && selectedSkinId !== 0) && selectedSkinAndChampion?.selectedSkinId === defaultSkinId;

  return {
    defaultSkinId,
    isDefaultSkin,
    selectedSkinAndChampion,
  };
}
