import type { FormattedChampion, FormattedSkin } from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import PremiumContentWrapper from '@/components/paywall/premium-content-wrapper.tsx';
import CharacterSelection from '@/features/skin-selector/character-selection.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage.tsx';
import { useAllDataDragon } from '@/hooks/useDataDragon/useDataDragon.ts';
import { saveSkinSelection } from '@/lib/champion-skin-store';
import { logger } from '@/lib/logger.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { State as LolSkinState, Service } from '@lolskin';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { useEffect } from 'react';
import { toast } from 'sonner'; // or your toast library
import {
  Handler,
} from '../../../../bindings/github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket/handler/index.ts';

export const Route = createFileRoute('/_protected/tools/')({
  component: RouteComponent,
});

function RouteComponent() {
  // const { gameflowPhase } = useGameflowPhase();
  // const { selectedSkinAndChampion, isDefaultSkin, defaultSkinId } = useGoState();
  const { allChampions, allSkins, isLoading } = useAllDataDragon();
  // const [isDismissed, setIsDismissed] = useState(false);

  const { user } = useUserStore();
  const router = useRouter();
  useEffect(() => {
    console.log('user', user);
  }, [user]);
  const [isLolskinEnabled, toggleLolSkinEnabled] = useLocalStorage<boolean>('lolskin-enabled', false);
  const handleSelectSkin = (champion: FormattedChampion, skin: FormattedSkin, chroma: any | null = null) => {
    if (!user?.premium.plan?.hasSkinChanger) {
      logger.info('lolskin', 'User is not a premium user blocking skin changer');
      return;
    }

    // Use toast.promise to show loading state during the entire process
    toast.promise(
      (async () => {
        // First save to the state
        await LolSkinState.SetChampionSkin(Number(champion.id), skin.num, chroma?.id || null);

        // Save to IndexedDB for persistence
        await saveSkinSelection({
          championId: Number(champion.id),
          skinNum: skin.num,
          chromaId: chroma?.id || null,
          timestamp: Date.now(),
        });

        // Trigger the backend injection process and wait for it to complete
        await Handler.SkinSelectionChanged(Number(champion.id), skin.num);

        logger.info('lolskin', `Skin injection completed for ${champion.name}: ${skin.name}`);
      })(),
      {
        loading: `Applying skin: ${skin.name}...`,
        success: `Skin applied: ${skin.name}`,
        error: 'Failed to apply skin. Please try again.',
      },
    );
  };
  const handleToggleSkinFeature = async () => {
    if (!user?.premium.plan?.hasSkinChanger) {
      logger.info('lolskin', 'User is not a premium user blocking skin feature toggle');
      return;
    }
    toast.promise(
      (async () => {
        await Service.ToggleLolSkinEnabled(!isLolskinEnabled);
        toggleLolSkinEnabled(!isLolskinEnabled);
      })(),
      {
        loading: isLolskinEnabled ? 'Disabling skin changer...' : 'Enabling skin changer...',
        success: isLolskinEnabled ? 'Skin changer disabled!' : 'Skin changer enabled!',
        error: 'Failed to toggle skin feature.',
      },
    );
  };

  return (
    <>
      <PremiumContentWrapper isPremiumUser={user?.premium.plan.hasSkinChanger} onPurchase={() => router.navigate({ to: '/subscription' })}>
        <CharacterSelection
          isLoading={isLoading}
          skins={allSkins}
          champions={allChampions}
          onSelectSkin={handleSelectSkin}
          isLolSkinEnabled={isLolskinEnabled}
          toggleLolSkinEnabled={handleToggleSkinFeature}
        />
      </PremiumContentWrapper>
    </>
  );
}
