import type {FormattedChampion, FormattedSkin} from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import CharacterSelection from '@/features/skin-selector/components/character-selection.tsx';
import {useAllDataDragon} from '@/hooks/useDataDragon/useDataDragon.ts';
import {State as LolSkinState} from '@lolskin';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/tools/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { allChampions, allSkins, isLoading } = useAllDataDragon();

  const handleSelectSkin = (champion: FormattedChampion, skin: FormattedSkin, chroma: any | null = null) => {
    LolSkinState.SetChampionSkin(Number(champion.id), skin.num, null);
    console.log('Selected', champion.name, skin.name, chroma);
    console.log('Selected IDS', champion.id, skin.num, chroma);
  };

  return (
    <CharacterSelection
      isLoading={isLoading}
      skins={allSkins}
      champions={allChampions}
      onSelectSkin={handleSelectSkin}
    />
  );
}
