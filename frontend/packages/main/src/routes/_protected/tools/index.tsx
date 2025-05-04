import type { FormattedChampion, FormattedSkin } from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import { Dock, DockIcon, DockItem, DockLabel } from '@/components/ui/dock';
import CharacterSelection from '@/features/skin-selector/character-selection.tsx';

import { useAllDataDragon } from '@/hooks/useDataDragon/useDataDragon.ts';
import { saveSkinSelection } from '@/lib/champion-skin-store';
import { State as LolSkinState } from '@lolskin';

import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import {
  Handler,
} from '../../../../bindings/github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket/handler/index.ts';

export const Route = createFileRoute('/_protected/tools/')({
  component: RouteComponent,
});

export function LobbyRevealerDock({ onClickAction }: { onClickAction?: () => void }) {
  return (
    <div className="fixed bottom-2 left-10/12 max-w-full -translate-x-1/2 z-[50]">
      <Dock className="items-end pb-3 !bg-card/60 backdrop-blur-sm">
        <button onClick={onClickAction} type="button">
          <DockItem className="aspect-square flex rounded-full bg-gray-200 dark:bg-neutral-800 relative">
            <motion.div
              className="absolute inset-0 w-full h-full rounded-full bg-gray-300 dark:bg-primary/30"
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
            <DockLabel>Open Opgg</DockLabel>
            <DockIcon>
              <img
                alt="opgg icon"
                src="https://s-opgg-kit.op.gg/gnb/config/images/icon/bfa5abe2f78d6e9a55e81c9988c31442.svg?image=q_auto:good,f_webp,w_48,h_48"
              />

            </DockIcon>
          </DockItem>
        </button>
      </Dock>
    </div>
  );
}
function RouteComponent() {
  const { allChampions, allSkins, isLoading } = useAllDataDragon();

  const handleSelectSkin = async (champion: FormattedChampion, skin: FormattedSkin, chroma: any | null = null) => {
    // Apply skin change
    LolSkinState.SetChampionSkin(Number(champion.id), skin.num, chroma?.id || null);

    // Save to IndexedDB
    try {
      await saveSkinSelection({
        championId: Number(champion.id),
        skinNum: skin.num,
        chromaId: chroma?.id || null,
        timestamp: Date.now(),
      });
      await Handler.SkinSelectionChanged(Number(champion.id), skin.num);

      console.log('Saved skin selection:', champion.name, skin.name);
    } catch (error) {
      console.error('Error saving skin selection:', error);
    }
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
