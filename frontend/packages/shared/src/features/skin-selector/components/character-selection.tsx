import type {Skin} from '@/hooks/useDataDragon/types/ddragon.ts';
import type {FormattedChampion, FormattedSkin} from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import {Button} from '@/components/ui/button.tsx';
import {Input} from '@/components/ui/input';
import CharacterCard from '@/features/skin-selector/components/character-card.tsx';
import {useLocalStorage} from '@/hooks/use-local-storage';
import {cn} from '@/lib/utils';
import {ArrowLeft, Search, X} from 'lucide-react';
import {useCallback, useEffect, useMemo, useState} from 'react';

// Type for user preferences
export type UserPreferences = {
  [championId: number]: {
    selectedSkinId: number;
    selectedChromaId?: number;
  };
};

type CharacterSelectionProps = {
  champions: FormattedChampion[];
  skins: FormattedSkin[];
  isEmbedded?: boolean;
  onSelectSkin?: (champion: FormattedChampion, skin: Skin, chroma?: any | null) => void;
  initialChampionId?: number;
  initialSkinId?: number;
  isLoading: boolean;
};

export default function CharacterSelection({
  champions,
  isEmbedded = false,
  skins,
  onSelectSkin,
  initialChampionId,
  initialSkinId,
  isLoading,
}: CharacterSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedChampion, setSelectedChampion] = useState<FormattedChampion | null>(null);

  // User preferences with local storage persistence
  const [userPreferences, setUserPreferences] = useLocalStorage<UserPreferences>('champion-preferences', {});

  // Initialize with selected champion if provided
  useEffect(() => {
    if (initialChampionId && !selectedChampion) {
      const champion = champions.find(c => Number(c.id) === initialChampionId);
      if (champion) {
        setSelectedChampion(champion);
      }
    }
  }, [champions, initialChampionId, selectedChampion]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter items based on search query and current view
  const filteredItems = useMemo(() => {
    const items = selectedChampion ? selectedChampion.skins : champions;
    if (!searchDebounced) {
      return items;
    }

    if (selectedChampion) {
      // Filter skins
      return selectedChampion.skins.filter(skin =>
        skin.name.toLowerCase().includes(searchDebounced.toLowerCase()),
      );
    } else {
      // Filter champions
      return champions.filter((champion) => {
        // Search in champion name
        if (champion.name.toLowerCase().includes(searchDebounced.toLowerCase())) {
          return true;
        }
        // Search in skin names
        return champion.skins.some(skin =>
          skin.name.toLowerCase().includes(searchDebounced.toLowerCase()),
        );
      });
    }
  }, [champions, selectedChampion, searchDebounced]);

  // Get the selected skin for a champion
  const getSelectedSkin = useCallback(
    (champion: FormattedChampion): FormattedSkin => {
      const pref = userPreferences[Number(champion.id)];
      if (!pref) {
        return champion.skins[0];
      }

      const selectedSkin = champion.skins.find(skin => Number(skin.id) === pref.selectedSkinId);
      return selectedSkin || champion.skins[0];
    },
    [userPreferences],
  );

  // Handle skin selection
  const handleSkinSelect = useCallback(
    (championId: number, skinId: number, chromaId?: number) => {
      setUserPreferences(prev => ({
        ...prev,
        [championId]: {
          selectedSkinId: skinId,
          ...(chromaId ? { selectedChromaId: chromaId } : {}),
        },
      }));

      // If in embedded mode, call the onSelectSkin callback
      if (isEmbedded && onSelectSkin && selectedChampion) {
        const skin = selectedChampion.skins.find(s => Number(s.id) === skinId) as FormattedSkin;
        if (skin) {
          const chroma = chromaId && skin.chromas ? skin.chromas.find(c => c.id === chromaId) : null;
          onSelectSkin(selectedChampion, skin as unknown as Skin, chroma || undefined);
        }
      }
    },
    [isEmbedded, onSelectSkin, selectedChampion, setUserPreferences],
  );

  // Handle card click based on current view
  const handleCardClick = (item: FormattedChampion | FormattedSkin) => {
    if (selectedChampion) {
      // We're in skin view, handle skin selection
      const skin = item as FormattedSkin;
      handleSkinSelect(Number(selectedChampion.id), Number(skin.id));
    } else {
      // We're in champion view, switch to skin view
      const champion = item as FormattedChampion;
      setSelectedChampion(champion);
      // Reset search when changing view
      setSearchQuery('');
      setSearchDebounced('');
    }
  };

  // Get page title
  const pageTitle = selectedChampion ? selectedChampion.name : 'All Champions';

  return (
    <div className={cn('flex flex-col h-full w-full  bg-background', isEmbedded && 'rounded-lg')}>
      <div className="pb-6">
        {/* Header with back button if showing skins */}
        <div className="flex gap-4 items-center mb-4">
          {selectedChampion && (
            <Button
              className="text-muted"
              variant="outline"
              onClick={() => setSelectedChampion(null)}
            >
              <ArrowLeft size={16} className="mr-2 text-white" />
              Back
            </Button>
          )}
          <h2 className="text-2xl font-bold text-foreground">{pageTitle}</h2>
        </div>

        {/* Search bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={selectedChampion ? 'Search skins...' : 'Search champions...'}
              className="pl-9 h-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Simple grid of cards */}
      <div className="flex-1 ">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <CharacterCard key={i} isLoading={true} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-6 ">
            {filteredItems.map((item) => {
              if (selectedChampion) {
                // Skin view
                const skin = item as FormattedSkin;
                const isSelected = userPreferences[Number(selectedChampion.id)]?.selectedSkinId === Number(skin.id);

                return (
                  <CharacterCard
                    key={skin.id}
                    skin={skin}
                    isSelected={isSelected}
                    onClick={() => handleCardClick(skin)}
                  />
                );
              } else {
                // Champion view
                const champion = item as FormattedChampion;
                const selectedSkin = getSelectedSkin(champion);

                return (
                  <CharacterCard
                    key={champion.id}
                    champion={champion}
                    selectedSkin={selectedSkin}
                    onClick={() => handleCardClick(champion)}
                  />
                );
              }
            })}
          </div>
        )}
      </div>
    </div>
  );
}
