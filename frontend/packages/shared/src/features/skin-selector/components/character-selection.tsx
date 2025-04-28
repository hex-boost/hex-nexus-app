import AlphabetSidebar from '@/components/alphabet-sidebar';
import Breadcrumb from '@/components/breadcrumb';
import ChampionDetail from '@/components/champion-detail';
import CharacterCard from '@/components/character-card';
import ConfigPanel from '@/components/config-panel';
import FilterPanel from '@/components/filter-panel';
import SearchHistoryPanel from '@/components/search-history-panel';
import SkinComparison from '@/components/skin-comparison';
import TagsPanel from '@/components/tags-panel';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage.tsx';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils.ts';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, Filter, Grid2X2, Grid3X3, List, Search, Settings, Tag, X } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Champion data types
export type Skin = {
  id: number;
  name: string;
  image: string;
  webm?: string;
  model3d?: string;
  abilities?: {
    name: string;
    image: string;
    video?: string;
  }[];
  chromas?: Chroma[];
  rarity: 'Common' | 'Epic' | 'Legendary' | 'Ultimate' | 'Mythic';
  releaseDate: string;
  skinLine: string;
};

export type Chroma = {
  id: number;
  name: string;
  color: string;
  image: string;
};

export type Champion = {
  id: number;
  name: string;
  image: string;
  skins: Skin[];
};

// Sample champion data
const champions: Champion[] = [
  {
    id: 1,
    name: 'Anivia',
    image: '/placeholder.svg?height=400&width=300',
    skins: [
      {
        id: 101,
        name: 'Default',
        image: '/placeholder.svg?height=400&width=300',
        rarity: 'Common',
        releaseDate: '2009-07-10',
        skinLine: 'Classic',
        abilities: [
          { name: 'Q - Flash Frost', image: '/placeholder.svg?height=100&width=100&text=Q' },
          { name: 'W - Crystallize', image: '/placeholder.svg?height=100&width=100&text=W' },
          { name: 'E - Frostbite', image: '/placeholder.svg?height=100&width=100&text=E' },
          { name: 'R - Glacial Storm', image: '/placeholder.svg?height=100&width=100&text=R' },
        ],
      },
      {
        id: 102,
        name: 'Blackfrost',
        image: '/placeholder.svg?height=400&width=300&text=Blackfrost',
        webm: '/placeholder.svg?height=400&width=300&text=Blackfrost+Video',
        model3d: '/placeholder.svg?height=400&width=300&text=3D+Model',
        rarity: 'Legendary',
        releaseDate: '2013-04-01',
        skinLine: 'Blackfrost',
        abilities: [
          { name: 'Q - Flash Frost', image: '/placeholder.svg?height=100&width=100&text=Q+Blackfrost' },
          { name: 'W - Crystallize', image: '/placeholder.svg?height=100&width=100&text=W+Blackfrost' },
          { name: 'E - Frostbite', image: '/placeholder.svg?height=100&width=100&text=E+Blackfrost' },
          { name: 'R - Glacial Storm', image: '/placeholder.svg?height=100&width=100&text=R+Blackfrost' },
        ],
      },
      {
        id: 103,
        name: 'Cosmic',
        image: '/placeholder.svg?height=400&width=300&text=Cosmic',
        webm: '/placeholder.svg?height=400&width=300&text=Cosmic+Video',
        rarity: 'Epic',
        releaseDate: '2020-06-18',
        skinLine: 'Cosmic',
        abilities: [
          { name: 'Q - Flash Frost', image: '/placeholder.svg?height=100&width=100&text=Q+Cosmic' },
          { name: 'W - Crystallize', image: '/placeholder.svg?height=100&width=100&text=W+Cosmic' },
          { name: 'E - Frostbite', image: '/placeholder.svg?height=100&width=100&text=E+Cosmic' },
          { name: 'R - Glacial Storm', image: '/placeholder.svg?height=100&width=100&text=R+Cosmic' },
        ],
        chromas: [
          { id: 1031, name: 'Ruby', color: '#ff0000', image: '/placeholder.svg?height=400&width=300&text=Ruby' },
          {
            id: 1032,
            name: 'Sapphire',
            color: '#0000ff',
            image: '/placeholder.svg?height=400&width=300&text=Sapphire',
          },
          { id: 1033, name: 'Emerald', color: '#00ff00', image: '/placeholder.svg?height=400&width=300&text=Emerald' },
        ],
      },
    ],
  },
  {
    id: 2,
    name: 'Annie',
    image: '/placeholder.svg?height=400&width=300',
    skins: [
      {
        id: 201,
        name: 'Default',
        image: '/placeholder.svg?height=400&width=300',
        rarity: 'Common',
        releaseDate: '2009-02-21',
        skinLine: 'Classic',
        abilities: [
          { name: 'Q - Disintegrate', image: '/placeholder.svg?height=100&width=100&text=Q' },
          { name: 'W - Incinerate', image: '/placeholder.svg?height=100&width=100&text=W' },
          { name: 'E - Molten Shield', image: '/placeholder.svg?height=100&width=100&text=E' },
          { name: 'R - Summon: Tibbers', image: '/placeholder.svg?height=100&width=100&text=R' },
        ],
      },
      {
        id: 202,
        name: 'Frostfire',
        image: '/placeholder.svg?height=400&width=300&text=Frostfire',
        rarity: 'Epic',
        releaseDate: '2011-01-14',
        skinLine: 'Winter Wonder',
        abilities: [
          { name: 'Q - Disintegrate', image: '/placeholder.svg?height=100&width=100&text=Q+Frostfire' },
          { name: 'W - Incinerate', image: '/placeholder.svg?height=100&width=100&text=W+Frostfire' },
          { name: 'E - Molten Shield', image: '/placeholder.svg?height=100&width=100&text=E+Frostfire' },
          { name: 'R - Summon: Tibbers', image: '/placeholder.svg?height=100&width=100&text=R+Frostfire' },
        ],
      },
      {
        id: 203,
        name: 'Hextech',
        image: '/placeholder.svg?height=400&width=300&text=Hextech',
        webm: '/placeholder.svg?height=400&width=300&text=Hextech+Video',
        rarity: 'Mythic',
        releaseDate: '2019-03-30',
        skinLine: 'Hextech',
        abilities: [
          { name: 'Q - Disintegrate', image: '/placeholder.svg?height=100&width=100&text=Q+Hextech' },
          { name: 'W - Incinerate', image: '/placeholder.svg?height=100&width=100&text=W+Hextech' },
          { name: 'E - Molten Shield', image: '/placeholder.svg?height=100&width=100&text=E+Hextech' },
          { name: 'R - Summon: Tibbers', image: '/placeholder.svg?height=100&width=100&text=R+Hextech' },
        ],
      },
    ],
  },
  {
    id: 6,
    name: 'Ezreal',
    image: '/placeholder.svg?height=400&width=300',
    skins: [
      {
        id: 601,
        name: 'Default',
        image: '/placeholder.svg?height=400&width=300',
        rarity: 'Common',
        releaseDate: '2010-03-16',
        skinLine: 'Classic',
        abilities: [
          { name: 'Q - Mystic Shot', image: '/placeholder.svg?height=100&width=100&text=Q' },
          { name: 'W - Essence Flux', image: '/placeholder.svg?height=100&width=100&text=W' },
          { name: 'E - Arcane Shift', image: '/placeholder.svg?height=100&width=100&text=E' },
          { name: 'R - Trueshot Barrage', image: '/placeholder.svg?height=100&width=100&text=R' },
        ],
      },
      {
        id: 602,
        name: 'Star Guardian',
        image: '/placeholder.svg?height=400&width=300&text=Star+Guardian',
        webm: '/placeholder.svg?height=400&width=300&text=Star+Guardian+Video',
        rarity: 'Legendary',
        releaseDate: '2019-09-12',
        skinLine: 'Star Guardian',
        abilities: [
          { name: 'Q - Mystic Shot', image: '/placeholder.svg?height=100&width=100&text=Q+SG' },
          { name: 'W - Essence Flux', image: '/placeholder.svg?height=100&width=100&text=W+SG' },
          { name: 'E - Arcane Shift', image: '/placeholder.svg?height=100&width=100&text=E+SG' },
          { name: 'R - Trueshot Barrage', image: '/placeholder.svg?height=100&width=100&text=R+SG' },
        ],
      },
      {
        id: 603,
        name: 'Battle Academia',
        image: '/placeholder.svg?height=400&width=300&text=Battle+Academia',
        webm: '/placeholder.svg?height=400&width=300&text=Battle+Academia+Video',
        rarity: 'Epic',
        releaseDate: '2019-03-28',
        skinLine: 'Battle Academia',
        abilities: [
          { name: 'Q - Mystic Shot', image: '/placeholder.svg?height=100&width=100&text=Q+BA' },
          { name: 'W - Essence Flux', image: '/placeholder.svg?height=100&width=100&text=W+BA' },
          { name: 'E - Arcane Shift', image: '/placeholder.svg?height=100&width=100&text=E+BA' },
          { name: 'R - Trueshot Barrage', image: '/placeholder.svg?height=100&width=100&text=R+BA' },
        ],
        chromas: [
          {
            id: 6031,
            name: 'Amethyst',
            color: '#9966cc',
            image: '/placeholder.svg?height=400&width=300&text=Amethyst',
          },
          { id: 6032, name: 'Citrine', color: '#e4d00a', image: '/placeholder.svg?height=400&width=300&text=Citrine' },
          {
            id: 6033,
            name: 'Rose Quartz',
            color: '#f7cac9',
            image: '/placeholder.svg?height=400&width=300&text=Rose+Quartz',
          },
        ],
      },
      {
        id: 604,
        name: 'Pulsefire',
        image: '/placeholder.svg?height=400&width=300&text=Pulsefire',
        webm: '/placeholder.svg?height=400&width=300&text=Pulsefire+Video',
        model3d: '/placeholder.svg?height=400&width=300&text=3D+Model',
        rarity: 'Ultimate',
        releaseDate: '2017-06-01',
        skinLine: 'Pulsefire',
        abilities: [
          { name: 'Q - Mystic Shot', image: '/placeholder.svg?height=100&width=100&text=Q+PF' },
          { name: 'W - Essence Flux', image: '/placeholder.svg?height=100&width=100&text=W+PF' },
          { name: 'E - Arcane Shift', image: '/placeholder.svg?height=100&width=100&text=E+PF' },
          { name: 'R - Trueshot Barrage', image: '/placeholder.svg?height=100&width=100&text=R+PF' },
        ],
      },
    ],
  },
];

// Recently added skins
const recentlyAddedSkins = [
  {
    champion: 'Ezreal',
    skin: {
      id: 605,
      name: 'Porcelain',
      image: '/placeholder.svg?height=400&width=300&text=Porcelain',
      rarity: 'Epic',
      releaseDate: '2023-01-12',
      skinLine: 'Porcelain',
    },
  },
  {
    champion: 'Annie',
    skin: {
      id: 204,
      name: 'Cafe Cuties',
      image: '/placeholder.svg?height=400&width=300&text=Cafe+Cuties',
      rarity: 'Epic',
      releaseDate: '2023-02-15',
      skinLine: 'Cafe Cuties',
    },
  },
  {
    champion: 'Anivia',
    skin: {
      id: 104,
      name: 'Divine Phoenix',
      image: '/placeholder.svg?height=400&width=300&text=Divine+Phoenix',
      rarity: 'Legendary',
      releaseDate: '2023-03-10',
      skinLine: 'Divine',
    },
  },
];

// Featured champions
const featuredChampions = [
  champions[2], // Ezreal
  champions[1], // Annie
  champions[0], // Anivia
];

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

// Type for search history
export type SearchHistoryItem = {
  query: string;
  timestamp: number;
};

// Type for skin tags
export type SkinTag = {
  id: string;
  name: string;
  color: string;
};

// Type for skin tag assignments
export type SkinTagAssignment = {
  skinId: number;
  tagIds: string[];
};

// View states
type ViewState = 'home' | 'champion' | 'comparison' | 'config' | 'tags' | 'history';

type CharacterSelectionProps = {
  isEmbedded?: boolean;
  onSelectSkin?: (champion: Champion, skin: Skin, chroma?: Chroma | null) => void;
  initialChampionId?: number;
  initialSkinId?: number;
};

export default function CharacterSelection({
  isEmbedded = false,
  onSelectSkin,
  initialChampionId,
  initialSkinId,
}: CharacterSelectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(null);
  const [viewState, setViewState] = useState<ViewState>('home');
  const [comparisonSkins, setComparisonSkins] = useState<{ champion: Champion; skin: Skin }[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const { toast } = useToast();

  // Filters
  const [filters, setFilters] = useState({
    skinLine: '',
    rarity: '',
    releaseYear: '',
    tags: [] as string[],
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

  // Search history
  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistoryItem[]>('search-history', []);

  // Skin tags
  const [skinTags, setSkinTags] = useLocalStorage<SkinTag[]>('skin-tags', [
    { id: 'favorite', name: 'Favorite', color: '#FFD700' },
    { id: 'owned', name: 'Owned', color: '#4CAF50' },
    { id: 'wishlist', name: 'Wishlist', color: '#2196F3' },
  ]);

  // Skin tag assignments
  const [skinTagAssignments, setSkinTagAssignments] = useLocalStorage<SkinTagAssignment[]>('skin-tag-assignments', []);

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

  // Initialize with selected champion if provided
  useEffect(() => {
    if (initialChampionId) {
      const champion = champions.find(c => c.id === initialChampionId);
      if (champion) {
        setSelectedChampion(champion);
        setViewState('champion');

        // If a specific skin is requested, update the user preferences
        if (initialSkinId) {
          const skin = champion.skins.find(s => s.id === initialSkinId);
          if (skin) {
            setUserPreferences(prev => ({
              ...prev,
              [champion.id]: {
                selectedSkinId: skin.id,
                ...(prev[champion.id]?.selectedChromaId
                  ? { selectedChromaId: prev[champion.id].selectedChromaId }
                  : {}),
              },
            }));
          }
        }
      }
    }
  }, [initialChampionId, initialSkinId, setUserPreferences]);

  // Add search query to history
  const addToSearchHistory = useCallback(
    (query: string) => {
      if (!query.trim()) {
        return;
      }

      setSearchHistory((prev) => {
        // Remove duplicates and keep only the 10 most recent searches
        const filtered = prev.filter(item => item.query.toLowerCase() !== query.toLowerCase());
        return [{ query, timestamp: Date.now() }, ...filtered].slice(0, 10);
      });
    },
    [setSearchHistory],
  );

  // Handle search query change
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      addToSearchHistory(query);
    }
  };

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => {
    return {
      skinLine: filters.skinLine,
      rarity: filters.rarity,
      releaseYear: filters.releaseYear,
      tags: [...filters.tags], // Create a new array reference
    };
  }, [filters.skinLine, filters.rarity, filters.releaseYear, filters.tags]);

  // Filter champions based on search query and filters
  const filteredChampions = useMemo(() => {
    return champions.filter((champion) => {
      // Search query filter
      if (searchQuery && !champion.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Apply additional filters
      if (
        memoizedFilters.skinLine
        || memoizedFilters.rarity
        || memoizedFilters.releaseYear
        || memoizedFilters.tags.length > 0
      ) {
        return champion.skins.some((skin) => {
          // Basic filters
          const matchesSkinLine = !memoizedFilters.skinLine || skin.skinLine === memoizedFilters.skinLine;
          const matchesRarity = !memoizedFilters.rarity || skin.rarity === memoizedFilters.rarity;
          const matchesYear
            = !memoizedFilters.releaseYear
              || new Date(skin.releaseDate).getFullYear().toString() === memoizedFilters.releaseYear;

          // Tag filters
          const matchesTags
            = memoizedFilters.tags.length === 0
              || memoizedFilters.tags.every((tagId) => {
                const assignment = skinTagAssignments.find(a => a.skinId === skin.id);
                return assignment && assignment.tagIds.includes(tagId);
              });

          return matchesSkinLine && matchesRarity && matchesYear && matchesTags;
        });
      }

      return true;
    });
  }, [champions, searchQuery, memoizedFilters, skinTagAssignments]);

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800); // Reduced loading time for better UX

    return () => clearTimeout(timer);
  }, []);

  // Get the selected skin for a champion
  const getSelectedSkin = useCallback(
    (champion: Champion) => {
      const pref = userPreferences[champion.id];
      if (!pref) {
        return champion.skins[0];
      } // Default skin

      const selectedSkin = champion.skins.find(skin => skin.id === pref.selectedSkinId);
      return selectedSkin || champion.skins[0];
    },
    [userPreferences],
  );

  // Get the selected chroma for a skin
  const getSelectedChroma = useCallback(
    (skin: Skin, championId: number) => {
      const pref = userPreferences[championId];
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
      setUserPreferences(prev => ({
        ...prev,
        [championId]: {
          selectedSkinId: skinId,
          ...(chromaId ? { selectedChromaId: chromaId } : {}),
        },
      }));

      toast({
        title: 'Preference saved',
        description: 'Your skin selection has been saved.',
        duration: 2000,
      });

      // If in embedded mode, call the onSelectSkin callback
      if (isEmbedded && onSelectSkin) {
        const champion = champions.find(c => c.id === championId);
        if (champion) {
          const skin = champion.skins.find(s => s.id === skinId);
          if (skin) {
            const chroma = chromaId && skin.chromas ? skin.chromas.find(c => c.id === chromaId) : null;
            onSelectSkin(champion, skin, chroma || undefined);
          }
        }
      }
    },
    [setUserPreferences, toast, isEmbedded, onSelectSkin],
  );

  // Add skin to comparison
  const addToComparison = useCallback(
    (champion: Champion, skin: Skin) => {
      if (comparisonSkins.length >= 3) {
        toast({
          title: 'Comparison limit reached',
          description: 'You can compare up to 3 skins at once.',
          variant: 'destructive',
          duration: 2000,
        });
        return;
      }

      // Check if already in comparison
      if (comparisonSkins.some(item => item.skin.id === skin.id)) {
        toast({
          title: 'Already in comparison',
          description: 'This skin is already in your comparison.',
          variant: 'destructive',
          duration: 2000,
        });
        return;
      }

      setComparisonSkins(prev => [...prev, { champion, skin }]);

      toast({
        title: 'Added to comparison',
        description: `${champion.name} - ${skin.name} added to comparison.`,
        duration: 2000,
      });

      if (comparisonSkins.length === 2) {
        setViewState('comparison');
      }
    },
    [comparisonSkins, toast],
  );

  // Remove skin from comparison
  const removeFromComparison = useCallback((skinId: number) => {
    setComparisonSkins(prev => prev.filter(item => item.skin.id !== skinId));
  }, []);

  // Get tags for a skin
  const getTagsForSkin = useCallback(
    (skinId: number) => {
      const assignment = skinTagAssignments.find(a => a.skinId === skinId);
      if (!assignment) {
        return [];
      }

      return assignment.tagIds
        .map(tagId => skinTags.find(tag => tag.id === tagId))
        .filter((tag): tag is SkinTag => tag !== undefined);
    },
    [skinTagAssignments, skinTags],
  );

  // Add tag to skin
  const addTagToSkin = useCallback(
    (skinId: number, tagId: string) => {
      setSkinTagAssignments((prev) => {
        const existing = prev.find(a => a.skinId === skinId);
        if (existing) {
          if (existing.tagIds.includes(tagId)) {
            return prev;
          }
          return prev.map(a => (a.skinId === skinId ? { ...a, tagIds: [...a.tagIds, tagId] } : a));
        } else {
          return [...prev, { skinId, tagIds: [tagId] }];
        }
      });

      const tag = skinTags.find(t => t.id === tagId);
      if (tag) {
        toast({
          title: 'Tag added',
          description: `${tag.name} tag added to skin.`,
          duration: 2000,
        });
      }
    },
    [setSkinTagAssignments, skinTags, toast],
  );

  // Remove tag from skin
  const removeTagFromSkin = useCallback(
    (skinId: number, tagId: string) => {
      setSkinTagAssignments((prev) => {
        const existing = prev.find(a => a.skinId === skinId);
        if (!existing) {
          return prev;
        }

        const updatedTagIds = existing.tagIds.filter(id => id !== tagId);
        if (updatedTagIds.length === 0) {
          return prev.filter(a => a.skinId !== skinId);
        }

        return prev.map(a => (a.skinId === skinId ? { ...a, tagIds: updatedTagIds } : a));
      });

      const tag = skinTags.find(t => t.id === tagId);
      if (tag) {
        toast({
          title: 'Tag removed',
          description: `${tag.name} tag removed from skin.`,
          duration: 2000,
        });
      }
    },
    [setSkinTagAssignments, skinTags, toast],
  );

  // Get breadcrumb items based on current view
  const getBreadcrumbItems = useCallback(() => {
    const items = [{ label: 'Home', onClick: () => setViewState('home') }];

    if (viewState === 'champion' && selectedChampion) {
      items.push({ label: selectedChampion.name, onClick: () => {} });
    } else if (viewState === 'comparison') {
      items.push({ label: 'Skin Comparison', onClick: () => {} });
    } else if (viewState === 'config') {
      items.push({ label: 'Configuration', onClick: () => {} });
    } else if (viewState === 'tags') {
      items.push({ label: 'Tag Management', onClick: () => {} });
    } else if (viewState === 'history') {
      items.push({ label: 'Search History', onClick: () => {} });
    }

    return items;
  }, [viewState, selectedChampion]);

  // Get card size based on grid size setting
  const getCardSize = useCallback(() => {
    switch (layoutConfig.gridSize) {
      case 'small':
        return 'h-[140px]';
      case 'large':
        return 'h-[220px]';
      default:
        return 'h-[180px]';
    }
  }, [layoutConfig.gridSize]);

  // Get grid columns based on layout setting
  const getGridColumns = useCallback(() => {
    if (layoutConfig.layout === 'list') {
      return 'grid-cols-1';
    }
    if (layoutConfig.layout === 'compact') {
      return 'grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10';
    }
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';
  }, [layoutConfig.layout]);

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
              onAddToComparison={addToComparison}
              animationDuration={getAnimationDuration()}
              skinTags={skinTags}
              getTagsForSkin={getTagsForSkin}
              onAddTag={addTagToSkin}
              onRemoveTag={removeTagFromSkin}
            />
          </motion.div>
        ) : viewState === 'comparison' ? (
          <motion.div
            key="skin-comparison"
            className="flex-1 h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: getAnimationDuration() }}
          >
            <SkinComparison
              items={comparisonSkins}
              onRemove={removeFromComparison}
              onBack={() => setViewState('home')}
              animationDuration={getAnimationDuration()}
            />
          </motion.div>
        ) : viewState === 'config' ? (
          <motion.div
            key="config-panel"
            className="flex-1 h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: getAnimationDuration() }}
          >
            <ConfigPanel config={layoutConfig} onUpdateConfig={setLayoutConfig} onBack={() => setViewState('home')} />
          </motion.div>
        ) : viewState === 'tags' ? (
          <motion.div
            key="tags-panel"
            className="flex-1 h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: getAnimationDuration() }}
          >
            <TagsPanel
              tags={skinTags}
              onUpdateTags={setSkinTags}
              tagAssignments={skinTagAssignments}
              onBack={() => setViewState('home')}
            />
          </motion.div>
        ) : viewState === 'history' ? (
          <motion.div
            key="history-panel"
            className="flex-1 h-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: getAnimationDuration() }}
          >
            <SearchHistoryPanel
              history={searchHistory}
              onClearHistory={() => setSearchHistory([])}
              onSelectQuery={(query) => {
                setSearchQuery(query);
                setViewState('home');
              }}
              onBack={() => setViewState('home')}
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
            {/* Sidebar */}
            {showSidebar && (
              <div className="w-60 bg-shade9 border-r border-border flex flex-col">
                {/* Search bar */}
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search champions"
                      className="pl-8 bg-shade8 border-shade7 text-foreground"
                      value={searchQuery}
                      onChange={e => handleSearchChange(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                        onClick={() => setSearchQuery('')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs flex items-center gap-1"
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        <Filter className="h-3 w-3" />
                        Filters
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs flex items-center gap-1"
                        onClick={() => setViewState('tags')}
                      >
                        <Tag className="h-3 w-3" />
                        Tags
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs flex items-center gap-1"
                        onClick={() => setViewState('history')}
                      >
                        <Clock className="h-3 w-3" />
                        History
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant={layoutConfig.layout === 'grid' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setLayoutConfig({ ...layoutConfig, layout: 'grid' })}
                      >
                        <Grid3X3 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant={layoutConfig.layout === 'compact' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setLayoutConfig({ ...layoutConfig, layout: 'compact' })}
                      >
                        <Grid2X2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant={layoutConfig.layout === 'list' ? 'secondary' : 'ghost'}
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setLayoutConfig({ ...layoutConfig, layout: 'list' })}
                      >
                        <List className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Filter panel */}
                {showFilters && (
                  <FilterPanel
                    filters={filters}
                    setFilters={setFilters}
                    onClose={() => setShowFilters(false)}
                    skinTags={skinTags}
                  />
                )}

                {/* Alphabet sidebar with champions */}
                <AlphabetSidebar
                  champions={champions}
                  onSelectChampion={(champion) => {
                    setSelectedChampion(champion);
                    setViewState('champion');
                  }}
                  userPreferences={userPreferences}
                  getSelectedSkin={getSelectedSkin}
                  getTagsForSkin={getTagsForSkin}
                />

                {/* Version info */}
                <div className="mt-auto p-4 flex items-center justify-between text-xs text-muted-foreground border-t border-border">
                  <span>Version: 15.9</span>
                  <button className="hover:text-foreground" onClick={() => setViewState('config')}>
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Main content */}
            <div className="flex-1 bg-background overflow-y-auto">
              {/* Breadcrumb */}
              <div className="flex items-center justify-between">
                <Breadcrumb items={getBreadcrumbItems()} />

                {/* Toggle sidebar button (only in embedded mode) */}
                {isEmbedded && (
                  <Button variant="ghost" size="sm" className="mr-4" onClick={() => setShowSidebar(!showSidebar)}>
                    {showSidebar ? 'Hide Sidebar' : 'Show Sidebar'}
                  </Button>
                )}
              </div>

              <div className="p-6">
                {/* Comparison bar */}
                {comparisonSkins.length > 0 && (
                  <div className="mb-6 bg-shade8 rounded-lg p-3 border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">Skin Comparison</h3>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setComparisonSkins([])}>
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setViewState('comparison')}
                          disabled={comparisonSkins.length < 2}
                        >
                          Compare
                          {' '}
                          {comparisonSkins.length > 0 && `(${comparisonSkins.length})`}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {comparisonSkins.map(({ champion, skin }) => (
                        <div
                          key={skin.id}
                          className="relative flex-shrink-0 w-20 h-20 rounded-md overflow-hidden group"
                        >
                          <Image
                            src={skin.image || '/placeholder.svg'}
                            alt={`${champion.name} - ${skin.name}`}
                            className="object-cover"
                            fill
                            sizes="80px"
                          />
                          <button
                            className="absolute top-1 right-1 bg-shade10/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => removeFromComparison(skin.id)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-shade10/80 text-xs p-1 truncate">
                            {skin.name}
                          </div>
                        </div>
                      ))}
                      {comparisonSkins.length < 3 && (
                        <div className="flex-shrink-0 w-20 h-20 rounded-md border border-dashed border-border flex items-center justify-center text-muted-foreground">
                          <span className="text-xs">Add skin</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Recently added section */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center">
                    Recently Added
                    <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">New</span>
                  </h2>

                  <div className="grid grid-cols-3 gap-6">
                    {isLoading
                      ? Array.from({ length: 3 })
                          .fill(0)
                          .map((_, index) => (
                            <div key={index} className="space-y-2">
                              <Skeleton className="h-[180px] w-full rounded-lg" />
                              <Skeleton className="h-4 w-24" />
                              <Skeleton className="h-3 w-16" />
                            </div>
                          ))
                      : recentlyAddedSkins.map(item => (
                          <motion.div
                            key={item.skin.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: getAnimationDuration() }}
                            className="group"
                          >
                            <div className="relative overflow-hidden rounded-lg cursor-pointer h-[180px]">
                              <div className="absolute inset-0 bg-gradient-to-t from-shade10 via-transparent to-transparent z-10" />
                              <Image
                                src={item.skin.image || '/placeholder.svg'}
                                alt={`${item.champion} - ${item.skin.name}`}
                                className="object-cover transition-transform group-hover:scale-105"
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                              <div className="absolute top-2 right-2 z-20">
                                <div className="px-2 py-0.5 bg-primary/80 rounded-full text-xs font-medium">
                                  {item.skin.rarity}
                                </div>
                              </div>
                              <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
                                <h3 className="text-foreground font-semibold">{item.skin.name}</h3>
                                <p className="text-xs text-muted-foreground">{item.champion}</p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-4 text-foreground">Featured Champions</h2>

                {/* Featured champions grid */}
                <div className="grid grid-cols-3 gap-6 mb-8">
                  {isLoading
                    ? Array.from({ length: 3 })
                        .fill(0)
                        .map((_, index) => (
                          <div key={index} className="space-y-2">
                            <Skeleton className="h-[220px] w-full rounded-lg" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        ))
                    : featuredChampions.map((champion) => {
                        const selectedSkin = getSelectedSkin(champion);
                        const selectedChroma = getSelectedChroma(selectedSkin, champion.id);
                        const skinTags = getTagsForSkin(selectedSkin.id);

                        return (
                          <motion.div
                            key={champion.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{ duration: getAnimationDuration() }}
                          >
                            <CharacterCard
                              champion={champion}
                              onClick={() => {
                                setSelectedChampion(champion);
                                setViewState('champion');
                              }}
                              featured={true}
                              selectedSkin={selectedSkin}
                              selectedChroma={selectedChroma}
                              tags={skinTags}
                            />
                          </motion.div>
                        );
                      })}
                </div>

                <h2 className="text-2xl font-bold mb-4 text-foreground">All Champions</h2>

                {/* All champions grid */}
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
                    : filteredChampions.map((champion) => {
                        const selectedSkin = getSelectedSkin(champion);
                        const selectedChroma = getSelectedChroma(selectedSkin, champion.id);
                        const skinTags = getTagsForSkin(selectedSkin.id);

                        return (
                          <motion.div
                            key={champion.id}
                            whileHover={{ scale: layoutConfig.animationSpeed !== 'none' ? 1.03 : 1 }}
                            whileTap={{ scale: layoutConfig.animationSpeed !== 'none' ? 0.97 : 1 }}
                            transition={{ duration: getAnimationDuration() }}
                          >
                            <CharacterCard
                              champion={champion}
                              onClick={() => {
                                setSelectedChampion(champion);
                                setViewState('champion');
                              }}
                              selectedSkin={selectedSkin}
                              selectedChroma={selectedChroma}
                              layout={layoutConfig.layout}
                              size={layoutConfig.gridSize}
                              tags={skinTags}
                            />
                          </motion.div>
                        );
                      })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
