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
import {
  Handler,
} from '../../../../bindings/github.com/hex-boost/hex-nexus-app/backend/internal/league/websocket/handler/index.ts';

export const Route = createFileRoute('/_protected/tools/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { allChampions, allSkins, isLoading } = useAllDataDragon();

  const { user } = useUserStore();
  const router = useRouter();
  const [isLolskinEnabled, toggleLolSkinEnabled] = useLocalStorage<boolean>('lolskin-enabled', false);
  const handleSelectSkin = async (champion: FormattedChampion, skin: FormattedSkin, chroma: any | null = null) => {
    if (user?.premium.tier !== 'pro') {
      logger.info('lolskin', 'User is not a premium user blocking skin changer');
      return;
    }
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
  useEffect(() => {
    if (user?.premium.tier !== 'pro') {
      logger.info('lolskin', 'User is not a premium user blocking skin feature toggle');
      Service.ToggleLolSkinEnabled(false);

      toggleLolSkinEnabled(false);
      return;
    }
    Service.ToggleLolSkinEnabled(isLolskinEnabled);
    toggleLolSkinEnabled(isLolskinEnabled);
    Service.StartInjection();
  }, []);
  const handleToggleSkinFeature = async () => {
    try {
      if (user?.premium.tier !== 'pro') {
        logger.info('lolskin', 'User is not a premium user blocking skin feature toggle');
        return;
      }
      await Service.ToggleLolSkinEnabled(!isLolskinEnabled);
      toggleLolSkinEnabled(!isLolskinEnabled);

      console.log('Skin feature toggled to:', !isLolskinEnabled);
    } catch (error) {
      console.error('Failed to toggle skin feature:', error);
    }
  };
  return (
    <>
      <PremiumContentWrapper isPremiumUser={user?.premium?.tier === 'pro'} onPurchase={() => router.navigate({ to: '/subscription' })}>
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
