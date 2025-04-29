import type {FormattedChampion, FormattedSkin} from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import {Button} from '@/components/ui/button.tsx';
import {Skeleton} from '@/components/ui/skeleton';
import CharacterCard from '@/features/skin-selector/components/character-card.tsx';
import {useVirtualizer} from '@tanstack/react-virtual';
import {ArrowLeft} from 'lucide-react';
import {useEffect, useRef, useState} from 'react';

type ChampionDetailProps = {
  champion: FormattedChampion;
  onBack: () => void;
  userPreferences?: {
    selectedSkinId: number;
    selectedChromaId?: number;
  };
  onSaveSkin: (championId: number, skinId: number, chromaId?: number) => void;
  animationDuration?: number;
};

export default function ChampionDetail({
  champion,
  onBack,
  userPreferences,
  onSaveSkin,
  // Keep the parameter even if not used directly, as it may be needed for future features
  // or for consistency with the API
}: ChampionDetailProps) {
  // Get the initially selected skin based on user preferences
  const initialSkinId = userPreferences?.selectedSkinId || Number(champion.skins[0].id);
  const initialSkin = champion.skins.find(skin => Number(skin.id) === initialSkinId) || champion.skins[0];

  const [selectedSkin, setSelectedSkin] = useState<FormattedSkin>(initialSkin);
  const [isLoading, setIsLoading] = useState(true);

  const parentRef = useRef<HTMLDivElement>(null);
  const [columns, setColumns] = useState(6);

  // Calculate grid properties based on window size
  useEffect(() => {
    const calculateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) {
        return 2;
      } // sm
      if (width < 768) {
        return 3;
      } // md
      if (width < 1024) {
        return 4;
      } // lg
      if (width < 1280) {
        return 5;
      } // xl
      return 6; // 2xl and above
    };

    const handleResize = () => {
      setColumns(calculateColumns());
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Simulate loading for smooth transition
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  // Handle skin selection
  const handleSkinSelect = (skin: FormattedSkin) => {
    setSelectedSkin(skin);
    onSaveSkin(Number(champion.id), Number(skin.id));
  };

  // Simplified virtualizer implementation
  const virtualizer = useVirtualizer({
    count: Math.ceil(champion.skins.length / columns),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 300, // Fixed row height for consistency with champion list
    overscan: 5,
  });

  return (
    <div className="flex flex-col h-full w-full bg-background">
      <div className="p-6 pb-3">
        <div className="flex gap-4 items-center mb-4">
          <Button
            className="text-muted"
            variant="outline"
            onClick={onBack}
          >
            <ArrowLeft size={16} className="mr-2 text-white" />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-foreground">{champion.name}</h2>
        </div>
      </div>

      {/* Virtualized skin list */}
      <div
        ref={parentRef}
        className="flex-1  p-6 pt-0"
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const rowIndex = virtualRow.index;
            const startIndex = rowIndex * columns;

            return (
              <div
                key={virtualRow.key}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 absolute w-full"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {Array.from({ length: columns }).map((_, columnIndex) => {
                  const itemIndex = startIndex + columnIndex;

                  if (itemIndex >= champion.skins.length) {
                    return null;
                  }

                  if (isLoading) {
                    return (
                      <div key={`skeleton-${itemIndex}`}>
                        <Skeleton className=" w-full rounded-lg" />
                      </div>
                    );
                  }

                  const skin = champion.skins[itemIndex];
                  return (
                    <div
                      key={skin.id}
                      className="h-[90px]"
                    >
                      <CharacterCard
                        skin={skin}
                        isSelected={selectedSkin.id === skin.id}
                        onClick={() => handleSkinSelect(skin)}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
