import type {FormattedChampion, FormattedSkin} from '@/hooks/useDataDragon/types/useDataDragonHook.ts';

import {Dock, DockIcon, DockItem, DockLabel} from '@/components/ui/dock';
import CharacterSelection from '@/features/skin-selector/components/character-selection.tsx';
import {useAllDataDragon} from '@/hooks/useDataDragon/useDataDragon.ts';

import {State as LolSkinState} from '@lolskin';
import {createFileRoute, Link} from '@tanstack/react-router';
import {motion} from 'framer-motion';
import {Activity} from 'lucide-react';

export const Route = createFileRoute('/_protected/tools/')({
  component: RouteComponent,
});

export function AppleStyleDock() {
  return (
    <div className="absolute bottom-12 left-11/12 max-w-full -translate-x-1/2">
      <Link to="/active-game">
        <Dock className="items-end pb-3 !bg-[#11101a] border">
          <DockItem className="aspect-square flex rounded-full bg-gray-200 dark:bg-neutral-800 relative">
            <motion.div
              className="absolute inset-0 w-full h-full rounded-full bg-gray-300 dark:bg-emerald-500/30"
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.6, 0.8, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <DockLabel>Active Game</DockLabel>
            <DockIcon>
              <Activity className="h-full w-full text-neutral-600 dark:text-neutral-300" />
            </DockIcon>
          </DockItem>
        </Dock>
      </Link>
    </div>
  );
}
function RouteComponent() {
  const { allChampions, allSkins, isLoading } = useAllDataDragon();

  const handleSelectSkin = (champion: FormattedChampion, skin: FormattedSkin, chroma: any | null = null) => {
    LolSkinState.SetChampionSkin(Number(champion.id), skin.num, null);
    console.log('Selected', champion.name, skin.name, chroma);
    console.log('Selected IDS', champion.id, skin.num, chroma);
  };

  return (
    <>
      <CharacterSelection
        isLoading={isLoading}
        skins={allSkins}
        champions={allChampions}
        onSelectSkin={handleSelectSkin}
      />
    </>
  );
}
