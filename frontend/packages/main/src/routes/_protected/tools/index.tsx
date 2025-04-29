import {Dock, DockIcon, DockItem, DockLabel} from '@/components/ui/dock';

import {createFileRoute} from '@tanstack/react-router';

import {Activity} from 'lucide-react';

export const Route = createFileRoute('/_protected/tools/')({
  component: RouteComponent,
});
const data = [
  {
    title: 'Active Game',
    icon: (
      <Activity className="h-full w-full text-neutral-600 dark:text-neutral-300" />
    ),
    href: '#',
  },
];

export function AppleStyleDock() {
  return (
    <div className="absolute bottom-12 left-11/12 max-w-full -translate-x-1/2">
      <Dock className="items-end pb-3">
        {data.map((item, idx) => (
          <DockItem
            key={idx}
            className="aspect-square rounded-full bg-gray-200 dark:bg-neutral-800 "
          >
            <DockLabel>{item.title}</DockLabel>
            <DockIcon>{item.icon}</DockIcon>
          </DockItem>
        ))}
      </Dock>
    </div>
  );
}

function RouteComponent() {
  // const { allChampions, allSkins, isLoading } = useAllDataDragon();
  //
  // const handleSelectSkin = (champion: FormattedChampion, skin: FormattedSkin, chroma: any | null = null) => {
  //   LolSkinState.SetChampionSkin(Number(champion.id), skin.num, null);
  //   console.log('Selected', champion.name, skin.name, chroma);
  //   console.log('Selected IDS', champion.id, skin.num, chroma);
  // };

  return (
    <>
      {/* <CharacterSelection */}
      {/*  isLoading={isLoading} */}
      {/*  skins={allSkins} */}
      {/*  champions={allChampions} */}
      {/*  onSelectSkin={handleSelectSkin} */}
      {/* /> */}
    </>
  );
}
