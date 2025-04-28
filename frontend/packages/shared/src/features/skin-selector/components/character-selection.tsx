import type {Skin} from '@/hooks/useDataDragon/types/ddragon.ts';
import type {FormattedChampion, FormattedSkin} from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import Breadcrumb from '@/features/skin-selector/components/breadcrumb';
import ChampionDetail from '@/features/skin-selector/components/champion-detail';
import {ChampionListComp} from '@/features/skin-selector/components/champion-list-comp.tsx';
import {useLocalStorage} from '@/hooks/use-local-storage';
import {cn} from '@/lib/utils';
import {AnimatePresence, motion} from 'framer-motion';
import {Search, X} from 'lucide-react';
import {useCallback, useMemo, useState} from 'react';

// Type for user preferences
export type UserPreferences = {
  [championId: number]: {
    selectedSkinId: number;
    selectedChromaId?: number;
  };
};

// Type for layout configuration
export type LayoutConfig = {
  gridSize: 'small' | 'medium' | 'large';
  layout: 'grid' | 'list' | 'compact';
  animationSpeed: 'none' | 'fast' | 'normal';
  cacheLimit: number; // in MB
};

// View states
type ViewState = 'home' | 'champion' | 'config';

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
  isLoading,
  isEmbedded = false,
  skins,
  onSelectSkin,
}: CharacterSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChampion, setSelectedChampion] = useState<FormattedChampion | null>(null);
  const [viewState, setViewState] = useState<ViewState>('home');
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    skinLine: '',
    rarity: '',
    releaseYear: '',
  });

  // User preferences with local storage persistence
  const [userPreferences, setUserPreferences] = useLocalStorage<UserPreferences>('champion-preferences', {});

  // Layout configuration
  const [layoutConfig, setLayoutConfig] = useLocalStorage<LayoutConfig>('layout-config', {
    gridSize: 'medium',
    layout: 'grid',
    animationSpeed: 'fast',
    cacheLimit: 500, // 500MB default
  });

  // Calculate animation duration based on config
  const getAnimationDuration = useCallback(() => {
    switch (layoutConfig.animationSpeed) {
      case 'none':
        return 0;
      case 'fast':
        return 0.15;
      case 'normal':
        return 0.3;
      default:
        return 0.15;
    }
  }, [layoutConfig.animationSpeed]);

  // Filter champions based on search query and filters
  const filteredChampions = useMemo(() => {
    return champions.filter((champion) => {
      // Search query filter
      if (searchQuery && !champion.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Apply additional filters

      return true;
    });
  }, [champions, searchQuery]);

  const getSelectedSkin = useCallback(
    (champion: FormattedChampion): FormattedSkin => {
      const pref = userPreferences[Number(champion.id)];
      if (!pref) {
        return champion.skins[0];
      }

      const selectedSkin = champion.skins.find(skin => Number(skin.id) === pref.selectedSkinId);
      return (selectedSkin || champion.skins[0]);
    },
    [userPreferences],
  );
  // Get the selected chroma for a skin
  const getSelectedChroma = useCallback(
    (skin: FormattedSkin, championId: string): any | null => {
      const pref = userPreferences[Number(championId)];
      if (!pref || !pref.selectedChromaId || !skin.chromas) {
        return null;
      }

      return skin.chromas.find(chroma => chroma.id === pref.selectedChromaId) || null;
    },
    [userPreferences],
  );
  // Save skin selection
  const saveSkinSelection = useCallback(
    (championId: number, skinId: number, chromaId?: number) => {
      setUserPreferences((prev) => {
        return {
          ...prev,
          [Number(championId)]: {
            selectedSkinId: skinId,
            ...(chromaId ? { selectedChromaId: chromaId } : {}),
          },
        };
      });

      // If in embedded mode, call the onSelectSkin callback
      if (isEmbedded && onSelectSkin) {
        const champion = champions.find(c => c.id === championId);
        if (champion) {
          const skin = champion.skins.find(s => Number(s.id) === skinId) as FormattedSkin;
          if (skin) {
            const chroma = chromaId && skin.chromas ? skin.chromas.find(c => c.id === chromaId) : null;
            onSelectSkin(champion, skin as unknown as Skin, chroma || undefined);
          }
        }
      }
    },
    [setUserPreferences, isEmbedded, onSelectSkin, champions],
  );
  // Get breadcrumb items based on current view
  const getBreadcrumbItems = useCallback(() => {
    const items = [{ label: 'Home', onClick: () => setViewState('home') }];

    if (viewState === 'champion' && selectedChampion) {
      items.push({ label: selectedChampion.name, onClick: () => {} });
    } else if (viewState === 'config') {
      items.push({ label: 'Configuration', onClick: () => {} });
    }

    return items;
  }, [viewState, selectedChampion]);

  return (
    <div className={cn('flex h-full w-full overflow-hidden bg-background', isEmbedded && 'rounded-lg')}>
      <AnimatePresence mode="wait" initial={false}>
        {viewState === 'champion' && selectedChampion ? (
          <motion.div
            key="champion-detail"
            className="flex-1 h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: getAnimationDuration() }}
          >
            <ChampionDetail
              champion={selectedChampion}
              onBack={() => setViewState('home')}
              userPreferences={userPreferences[selectedChampion.id]}
              onSaveSkin={saveSkinSelection}
              animationDuration={getAnimationDuration()}
            />
          </motion.div>
        ) : (
          <motion.div
            key="champion-selection"
            className="flex flex-1 h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: getAnimationDuration() }}
          >
            {/* Main content with top filter bar */}
            <div className="flex-1 bg-background overflow-y-auto">
              {/* Top filter bar */}
              <div className="sticky top-0 z-10 bg-shade9 border-b border-border p-4 space-y-3">
                {/* Search and layout controls */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-xl">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search champions or skins..."
                      className="pl-9 h-10 bg-shade8 border-shade7"
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

                {/* Expanded filter panel */}
                {showFilters && (
                  <div className="bg-shade8 rounded-lg p-4 border border-border animate-in fade-in-50 slide-in-from-top-5 duration-200">
                    <div className="flex flex-wrap gap-4">
                      <div className="space-y-1 min-w-[180px]">
                        <label className="text-xs text-muted-foreground">Skin Line</label>
                        <Select
                          value={filters.skinLine}
                          onValueChange={value => setFilters({ ...filters, skinLine: value })}
                        >
                          <SelectTrigger className="bg-shade9 h-9">
                            <SelectValue placeholder="All skin lines" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All skin lines</SelectItem>
                            <SelectItem value="Classic">Classic</SelectItem>
                            <SelectItem value="Star Guardian">Star Guardian</SelectItem>
                            <SelectItem value="PROJECT">PROJECT</SelectItem>
                            <SelectItem value="Battle Academia">Battle Academia</SelectItem>
                            <SelectItem value="Pulsefire">Pulsefire</SelectItem>
                            <SelectItem value="Cosmic">Cosmic</SelectItem>
                            <SelectItem value="Blackfrost">Blackfrost</SelectItem>
                            <SelectItem value="Hextech">Hextech</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1 min-w-[180px]">
                        <label className="text-xs text-muted-foreground">Rarity</label>
                        <Select
                          value={filters.rarity}
                          onValueChange={value => setFilters({ ...filters, rarity: value })}
                        >
                          <SelectTrigger className="bg-shade9 h-9">
                            <SelectValue placeholder="All rarities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All rarities</SelectItem>
                            <SelectItem value="Common">Common</SelectItem>
                            <SelectItem value="Epic">Epic</SelectItem>
                            <SelectItem value="Legendary">Legendary</SelectItem>
                            <SelectItem value="Ultimate">Ultimate</SelectItem>
                            <SelectItem value="Mythic">Mythic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1 min-w-[180px]">
                        <label className="text-xs text-muted-foreground">Release Year</label>
                        <Select
                          value={filters.releaseYear}
                          onValueChange={value => setFilters({ ...filters, releaseYear: value })}
                        >
                          <SelectTrigger className="bg-shade9 h-9">
                            <SelectValue placeholder="All years" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All years</SelectItem>
                            <SelectItem value="2023">2023</SelectItem>
                            <SelectItem value="2022">2022</SelectItem>
                            <SelectItem value="2021">2021</SelectItem>
                            <SelectItem value="2020">2020</SelectItem>
                            <SelectItem value="2019">2019</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFilters({ skinLine: '', rarity: '', releaseYear: '' })}
                          disabled={!filters.skinLine && !filters.rarity && !filters.releaseYear}
                        >
                          Reset Filters
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Active filters display */}
                {(filters.skinLine || filters.rarity || filters.releaseYear || searchQuery) && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Active filters:</span>
                    <div className="flex flex-wrap gap-1">
                      {searchQuery && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Search:
                          {' '}
                          {searchQuery}
                          <button onClick={() => setSearchQuery('')}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {filters.skinLine && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Skin Line:
                          {' '}
                          {filters.skinLine}
                          <button onClick={() => setFilters({ ...filters, skinLine: '' })}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {filters.rarity && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Rarity:
                          {' '}
                          {filters.rarity}
                          <button onClick={() => setFilters({ ...filters, rarity: '' })}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                      {filters.releaseYear && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          Year:
                          {' '}
                          {filters.releaseYear}
                          <button onClick={() => setFilters({ ...filters, releaseYear: '' })}>
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Breadcrumb */}
              <div className="p-4 pt-2">
                <Breadcrumb items={getBreadcrumbItems()} />
              </div>

              <div className="p-6">

                <h2 className="text-2xl font-bold mb-4 text-foreground">All Champions</h2>

                {/* All champions grid using the new ChampionList component */}
                <ChampionListComp
                  champions={filteredChampions}
                  isLoading={isLoading}
                  onSelectChampion={(champion) => {
                    setSelectedChampion(champion);
                    setViewState('champion');
                  }}
                  skins={skins}
                  getSelectedSkin={getSelectedSkin}
                  layout={layoutConfig.layout}
                  gridSize={layoutConfig.gridSize}
                  animationDuration={getAnimationDuration()}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
