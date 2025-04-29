import type {FormattedChampion, FormattedSkin} from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import {Skeleton} from '@/components/ui/skeleton.tsx';
import CharacterCard from '@/features/skin-selector/components/character-card.tsx';
import React from 'react';

type ChampionListProps = {
  champions: FormattedChampion[];
  isLoading: boolean;
  onSelectChampion: (champion: FormattedChampion) => void;
  getSelectedSkin: (champion: FormattedChampion) => FormattedSkin;
  layout: 'grid' | 'list' | 'compact';
  gridSize: 'small' | 'medium' | 'large';
  animationDuration: number;
};

export const ChampionListComp: React.FC<ChampionListProps> = ({
  champions,
  isLoading,
  onSelectChampion,
  getSelectedSkin,
}) => {
  // Items to display - either skeletons or actual champions
  const items = isLoading ? Array.from({ length: 24 }).fill(null) : champions;

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4 w-full">
        {items.map((item, index) => (
          <div key={index} className="h-[90px]">
            {isLoading
              ? (
                  <div className="space-y-2">
                    <Skeleton className="h-[70px] w-full rounded-lg" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                )
              : (
                  <CharacterCard
                    champion={champions[index]}
                    onClick={() => onSelectChampion(champions[index])}
                    selectedSkin={getSelectedSkin(champions[index])}
                  />
                )}
          </div>
        ))}
      </div>
    </div>
  );
};
