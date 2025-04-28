import type {FormattedChampion, FormattedSkin} from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import SkinSelectorPage from '@/features/skin-selector/skin-selector-page.tsx';
import {useAllDataDragon} from '@/hooks/useDataDragon/useDataDragon.ts';
import {createFileRoute} from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/tools/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { allChampions } = useAllDataDragon();

  const handleSelectSkin = (champion: FormattedChampion, skin: FormattedSkin, chroma: any | null = null) => {
    // Handle skin selection
    console.log('Selected', champion.name, skin.name, chroma);
  };

  return <SkinSelectorPage
    champions={allChampions}
    onSelectSkin={handleSelectSkin}
    initialChampionId={1}
    initialSkinId={1001}
  />;
}
