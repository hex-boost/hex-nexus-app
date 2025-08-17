import type { FormattedChampion, FormattedSkin } from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Label } from '@/components/ui/label.tsx';
import { Switch } from '@/components/ui/switch.tsx';
import CharacterCard from '@/features/skin-selector/components/character-card.tsx';
import { SkinSelectorTutorial } from '@/features/skin-selector/skin-selector-tutorial.tsx';
import { getSkinSelections, saveSkinSelection } from '@/lib/champion-skin-store';
import { cn } from '@/lib/utils.ts';
import { ArrowLeft, HelpCircle, Search, Trash2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
  onSelectSkin?: (champion: FormattedChampion, skin: FormattedSkin, chroma?: any | null) => void;
  initialChampionId?: number;
  initialSkinId?: number;
  isLoading: boolean;
  isLolSkinEnabled?: boolean;
  toggleLolSkinEnabled?: () => Promise<void>; // Optional prop to control skin feature toggle
  resetAllSkins?: () => Promise<void>; // New prop for resetting all skins
};

export default function CharacterSelection({
  champions,
  onSelectSkin,
  initialChampionId,
  isLoading,
  isLolSkinEnabled, // Default to true if not provided
  toggleLolSkinEnabled, // Optional prop to control skin feature toggle
  resetAllSkins, // New prop for resetting skins
}: CharacterSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selectedChampion, setSelectedChampion] = useState<FormattedChampion | null>(null);
  const skinCheckIntervalRef = useRef<number | null>(null);

  const [skinSelections, setSkinSelections] = useState<Record<number, { skinNum: number; chromaId: number | null }>>({});

  // Load saved skin selections when component mounts
  const loadSkinSelections = useCallback(async () => {
    try {
      const selections = await getSkinSelections();
      const selectionsMap: Record<number, { skinNum: number; chromaId: number | null }> = {};

      selections.forEach((selection) => {
        selectionsMap[selection.championId] = {
          skinNum: selection.skinNum,
          chromaId: selection.chromaId,
        };
      });

      setSkinSelections(selectionsMap);
    } catch (error) {
      console.error('Failed to load skin selections', error);
    }
  }, []);

  // Load on component mount
  useEffect(() => {
    loadSkinSelections();

    // Set up periodic refresh to catch external changes
    skinCheckIntervalRef.current = window.setInterval(() => {
      loadSkinSelections();
    }, 1000);

    return () => {
      if (skinCheckIntervalRef.current) {
        clearInterval(skinCheckIntervalRef.current);
      }
    };
  }, [loadSkinSelections]);

  useEffect(() => {
    // Existing champion initialization code remains the same
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

  // Separate champions into those with skins selected and those without
  const { championsWithSkins, championsWithoutSkins } = useMemo(() => {
    const withSkins: FormattedChampion[] = [];
    const withoutSkins: FormattedChampion[] = [];

    champions.forEach((champion) => {
      const championId = Number(champion.id);
      if (skinSelections[championId]
        && skinSelections[championId].skinNum !== champion.skins[0].num) { // Skip if default skin is selected
        withSkins.push(champion);
      } else {
        withoutSkins.push(champion);
      }
    });

    return { championsWithSkins: withSkins, championsWithoutSkins: withoutSkins };
  }, [champions, skinSelections]);

  // Filter items based on search query and current view
  const filteredItems = useMemo(() => {
    if (selectedChampion) {
      // If in skin view, filter the selected champion's skins
      if (!searchDebounced) {
        return selectedChampion.skins;
      }

      return selectedChampion.skins.filter(skin =>
        skin.name.toLowerCase().includes(searchDebounced.toLowerCase()),
      );
    } else {
      // If in champion view, we'll handle rendering separately in the JSX
      if (!searchDebounced) {
        return { championsWithSkins, championsWithoutSkins };
      }

      // Filter both groups based on search
      const filteredWithSkins = championsWithSkins.filter((champion) => {
        if (champion.name.toLowerCase().includes(searchDebounced.toLowerCase())) {
          return true;
        }
        return champion.skins.some(skin =>
          skin.name.toLowerCase().includes(searchDebounced.toLowerCase()),
        );
      });

      const filteredWithoutSkins = championsWithoutSkins.filter((champion) => {
        if (champion.name.toLowerCase().includes(searchDebounced.toLowerCase())) {
          return true;
        }
        return champion.skins.some(skin =>
          skin.name.toLowerCase().includes(searchDebounced.toLowerCase()),
        );
      });

      return {
        championsWithSkins: filteredWithSkins,
        championsWithoutSkins: filteredWithoutSkins,
      };
    }
  }, [championsWithSkins, championsWithoutSkins, selectedChampion, searchDebounced]);

  // Get the selected skin for a champion
  const getSelectedSkin = useCallback(
    (champion: FormattedChampion): FormattedSkin => {
      const selection = skinSelections[Number(champion.id)];
      if (!selection) {
        return champion.skins[0];
      }

      // Find skin by skin number (not ID)
      const selectedSkin = champion.skins.find(skin => Number(skin.num) === selection.skinNum);
      return selectedSkin || champion.skins[0];
    },
    [skinSelections],
  );

  // Handle skin selection
  const handleSkinSelect = useCallback(
    (championId: number, skinId: number, chromaId?: number) => {
      // Find skin num from skin ID
      const skin = selectedChampion?.skins.find(s => Number(s.id) === skinId);
      if (!skin) {
        return;
      }

      // Update local state for immediate UI feedback
      setSkinSelections(prev => ({
        ...prev,
        [championId]: {
          skinNum: skin.num,
          chromaId: chromaId || null,
        },
      }));

      // Save to the skin store
      saveSkinSelection({
        championId,
        skinNum: skin.num,
        chromaId: chromaId || null,
        timestamp: Date.now(),
      }).then(() => {
        // Refresh skin selections after saving
        loadSkinSelections();
      });

      // If in embedded mode, call the onSelectSkin callback
      if (onSelectSkin && selectedChampion) {
        const chroma = chromaId && skin.chromas ? skin.chromas.find(c => c.id === chromaId) : null;
        onSelectSkin(selectedChampion, skin, chroma || undefined);
      }
    },
    [onSelectSkin, selectedChampion, loadSkinSelections],
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
  const [showTutorial, setShowTutorial] = useState(false);
  const pageTitle = selectedChampion ? selectedChampion.name : 'Skin Selector';

  // Render champion cards for a given list
  const renderChampionCards = (championsList: FormattedChampion[]) => {
    return championsList.map((champion) => {
      const selectedSkin = getSelectedSkin(champion);

      return (
        <CharacterCard
          key={champion.id}
          champion={champion}
          selectedSkin={selectedSkin}
          onClick={() => handleCardClick(champion)}
        />
      );
    });
  };

  return (
    <div className={cn('flex flex-col h-full w-full  bg-background')}>
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
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-semibold text-foreground">{pageTitle}</h2>
              {/* Add this after the title in the header */}
              <div className="flex items-center space-x-2 ml-auto">
                <Switch
                  id="skin-feature-switch"
                  checked={isLolSkinEnabled}
                  onCheckedChange={toggleLolSkinEnabled}
                />
                <Label htmlFor="skin-feature-switch" className="text-sm">
                  {isLolSkinEnabled ? 'Enabled' : 'Disabled'}
                </Label>
              </div>
            </div>
            <div className="flex gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2" size={16} />
                    Reset All Skins
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will reset all your skin selections to defaults and clear the cache.
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={resetAllSkins} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Reset
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button variant="outline" onClick={() => setShowTutorial(true)}>
                How It Works
                <HelpCircle className="ml-2" size={16} />
              </Button>
            </div>
          </div>
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

      {/* Content section */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <CharacterCard key={i} isLoading={true} />
            ))}
          </div>
        ) : (
          <>
            {selectedChampion ? (
            // Skin view
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-6">
                {(filteredItems as FormattedSkin[]).map((skin) => {
                  const isSelected = skinSelections[Number(selectedChampion.id)]?.skinNum === skin.num;
                  return (
                    <CharacterCard
                      key={skin.id}
                      skin={skin}
                      isSelected={isSelected}
                      onClick={() => handleCardClick(skin)}
                    />
                  );
                })}
              </div>
            ) : (
            // Champions view with two sections
              <>
                {/* Champions with skins selected section */}
                {(filteredItems as { championsWithSkins: FormattedChampion[]; championsWithoutSkins: FormattedChampion[] })
                  .championsWithSkins
                  .length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-medium text-foreground mb-4 border-b pb-2">Champions with Skins Selected</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {renderChampionCards((filteredItems as any).championsWithSkins)}
                    </div>
                  </div>
                )}

                {/* All champions section */}
                {(filteredItems as { championsWithSkins: FormattedChampion[]; championsWithoutSkins: FormattedChampion[] })
                  .championsWithoutSkins
                  .length > 0 && (
                  <div>
                    <h3 className="text-xl font-medium text-foreground mb-4 border-b pb-2">All Champions</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-6">
                      {renderChampionCards((filteredItems as any).championsWithoutSkins)}
                    </div>
                  </div>
                )}

                {/* Show message when no champions found */}
                {(filteredItems as any).championsWithSkins.length === 0
                  && (filteredItems as any).championsWithoutSkins.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No champions found matching "
                    {searchDebounced}
                    "
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
      <SkinSelectorTutorial open={showTutorial} setOpen={setShowTutorial} />
    </div>
  );
}
