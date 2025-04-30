import { useAllDataDragon } from '@/hooks/useDataDragon/useDataDragon.ts';
import { getSkinSelections } from '@/lib/champion-skin-store';
import { State as LolSkinState } from '@lolskin';
import { useEffect } from 'react';

export function useChampionSkin() {
  const { isLoading, allChampions } = useAllDataDragon();

  useEffect(() => {
    const applySavedSelections = async () => {
      if (isLoading || allChampions.length === 0) {
        return;
      }

      try {
        const selections = await getSkinSelections();
        selections.forEach((selection) => {
          LolSkinState.SetChampionSkin(
            selection.championId,
            selection.skinNum,
            selection.chromaId,
          );
        });

        console.log('Applied saved skin selections:', selections.length);
      } catch (error) {
        console.error('Error loading skin selections:', error);
      }
    };

    applySavedSelections();
  }, [isLoading, allChampions]);
}
