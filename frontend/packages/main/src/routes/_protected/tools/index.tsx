import SkinSelectorPage from '@/features/skin-selector/skin-selector-page.tsx';
import { useAllDataDragon } from '@/hooks/useDataDragon/useDataDragon.ts';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/tools/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { allChampions } = useAllDataDragon();
  return <SkinSelectorPage onSelectSkin={(champion: typeof allChampions[0]) => void 0} initialChampionId={1} initialSkinId={1001} />;
}
