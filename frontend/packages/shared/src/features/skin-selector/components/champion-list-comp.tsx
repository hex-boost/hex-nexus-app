// 1. Fix function parameter types in ChampionListProps
import type { FormattedChampion, FormattedSkin } from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import CharacterCard from '@/features/skin-selector/components/character-card.tsx';
import { motion } from 'framer-motion';
import React, { useCallback } from 'react';

type ChampionListProps = {
  skins: FormattedSkin[];
  champions: FormattedChampion[];
  isLoading: boolean;
  onSelectChampion: (champion: FormattedChampion) => void;
  getSelectedSkin: (champion: FormattedChampion) => FormattedSkin; // Changed from Skin to FormattedChampion parameter
  getSelectedChroma: (skin: FormattedSkin, championId: string) => any | null; // Changed parameter type to FormattedSkin
  layout: 'grid' | 'list' | 'compact'; // Use literal union type instead of string
  gridSize: 'small' | 'medium' | 'large'; // Use literal union type instead of string
  animationDuration: number;
};
export const ChampionListComp: React.FC<ChampionListProps> = ({
  champions,
  isLoading,
  skins,
  onSelectChampion,
  getSelectedSkin,
  getSelectedChroma,
  layout,
  gridSize,
  animationDuration,
}) => {
  const getCardSize = useCallback(() => {
    switch (gridSize) {
      case 'small':
        return 'h-[140px]';
      case 'large':
        return 'h-[220px]';
      default:
        return 'h-[180px]';
    }
  }, [gridSize]);

  const getGridColumns = useCallback(() => {
    if (layout === 'list') {
      return 'grid-cols-1';
    }
    if (layout === 'compact') {
      return 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10';
    }
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
  }, [layout]);

  return (
    <div className={`grid ${getGridColumns()} gap-4 mb-8`}>
      {isLoading
        ? Array.from({ length: 12 })
            .fill(0)
            .map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className={`${getCardSize()} w-full rounded-lg`} />
                <Skeleton className="h-4 w-20" />
              </div>
            ))
        : champions.map((champion) => {
            const selectedSkin = getSelectedSkin(champion);
            const selectedChroma = getSelectedChroma(selectedSkin, champion.id);

            return (
              <motion.div
                key={champion.id}
                whileHover={{ scale: layout !== 'list' ? 1.03 : 1 }}
                whileTap={{ scale: layout !== 'list' ? 0.97 : 1 }}
                transition={{ duration: animationDuration }}
              >
                <CharacterCard
                  skins={skins}
                  champion={champion}
                  onClick={() => onSelectChampion(champion)}
                  selectedSkin={selectedSkin}
                  // selectedChroma={selectedChroma}
                  layout={layout as 'grid' | 'list' | 'compact'}
                  size={gridSize as 'small' | 'medium' | 'large'}
                />
              </motion.div>
            );
          })}
    </div>
  );
};
