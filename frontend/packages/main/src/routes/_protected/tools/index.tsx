import type {Skin} from '@/hooks/useDataDragon/types/ddragon.ts';
import type {FormattedChampion} from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import CharacterSelection from '@/features/skin-selector/components/character-selection.tsx';
import {useAllDataDragon} from '@/hooks/useDataDragon/useDataDragon.ts';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/tools/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { allChampions,allSkins } = useAllDataDragon();

  const handleSelectSkin = (champion: FormattedChampion, skin: Skin, chroma: any | null = null) => {
    // Handle skin selection
    console.log('Selected', champion.name, skin.name, chroma);
  };

  return (
    <CharacterSelection
        skins={allSkins}
      champions={allChampions}
      onSelectSkin={handleSelectSkin}
      initialChampionId={undefined}
      initialSkinId={undefined}
    />
  );
}
