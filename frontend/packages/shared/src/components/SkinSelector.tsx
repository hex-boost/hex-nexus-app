'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Check, ChevronLeft, ChevronRight, Filter, Info, Search, Star, X } from 'lucide-react';
import { useEffect, useState } from 'react';

// Types
type Champion = {
  id: string;
  name: string;
  title: string;
  image: string;
  skins: Skin[];
  selectedSkinId?: string;
};

type Skin = {
  id: string;
  name: string;
  image: string;
  rarity: 'Common' | 'Epic' | 'Legendary' | 'Ultimate' | 'Mythic';
  releaseYear?: number;
  description?: string;
};

// Sample data for demonstration
const CHAMPIONS: Champion[] = [
  {
    id: 'ahri',
    name: 'Ahri',
    title: 'the Nine-Tailed Fox',
    image: '/placeholder.svg?height=120&width=120&text=Ahri',
    skins: [
      {
        id: 'ahri-default',
        name: 'Default',
        image: '/placeholder.svg?height=200&width=350&text=Default+Ahri',
        rarity: 'Common',
        releaseYear: 2011,
        description: 'The original Ahri skin.',
      },
      {
        id: 'ahri-dynasty',
        name: 'Dynasty Ahri',
        image: '/placeholder.svg?height=200&width=350&text=Dynasty+Ahri',
        rarity: 'Common',
        releaseYear: 2011,
        description: 'Ahri dressed in traditional Korean attire.',
      },
      {
        id: 'ahri-midnight',
        name: 'Midnight Ahri',
        image: '/placeholder.svg?height=200&width=350&text=Midnight+Ahri',
        rarity: 'Common',
        releaseYear: 2011,
        description: 'Ahri with a darker color scheme.',
      },
      {
        id: 'ahri-foxfire',
        name: 'Foxfire Ahri',
        image: '/placeholder.svg?height=200&width=350&text=Foxfire+Ahri',
        rarity: 'Epic',
        releaseYear: 2012,
        description: 'Ahri with fiery orange tails and effects.',
      },
      {
        id: 'ahri-popstar',
        name: 'Popstar Ahri',
        image: '/placeholder.svg?height=200&width=350&text=Popstar+Ahri',
        rarity: 'Epic',
        releaseYear: 2013,
        description: 'Ahri as a K-pop star with blonde hair.',
      },
      {
        id: 'ahri-challenger',
        name: 'Challenger Ahri',
        image: '/placeholder.svg?height=200&width=350&text=Challenger+Ahri',
        rarity: 'Epic',
        releaseYear: 2015,
        description: 'Ahri in red and gold attire for the 2015 competitive season.',
      },
      {
        id: 'ahri-academy',
        name: 'Academy Ahri',
        image: '/placeholder.svg?height=200&width=350&text=Academy+Ahri',
        rarity: 'Epic',
        releaseYear: 2015,
        description: 'Ahri as a high school student.',
      },
      {
        id: 'ahri-arcade',
        name: 'Arcade Ahri',
        image: '/placeholder.svg?height=200&width=350&text=Arcade+Ahri',
        rarity: 'Epic',
        releaseYear: 2016,
        description: 'Ahri in a pixel-art style with arcade game effects.',
      },
      {
        id: 'ahri-starguardian',
        name: 'Star Guardian Ahri',
        image: '/placeholder.svg?height=200&width=350&text=Star+Guardian+Ahri',
        rarity: 'Legendary',
        releaseYear: 2017,
        description: 'Ahri as the leader of the Star Guardian team with new animations and voice lines.',
      },
      {
        id: 'ahri-kda',
        name: 'K/DA Ahri',
        image: '/placeholder.svg?height=200&width=350&text=K/DA+Ahri',
        rarity: 'Epic',
        releaseYear: 2018,
        description: 'Ahri as a member of the K/DA pop group.',
      },
      {
        id: 'ahri-prestige-kda',
        name: 'Prestige K/DA Ahri',
        image: '/placeholder.svg?height=200&width=350&text=Prestige+K/DA+Ahri',
        rarity: 'Epic',
        releaseYear: 2019,
        description: 'A golden variant of K/DA Ahri.',
      },
      {
        id: 'ahri-elderwood',
        name: 'Elderwood Ahri',
        image: '/placeholder.svg?height=200&width=350&text=Elderwood+Ahri',
        rarity: 'Epic',
        releaseYear: 2019,
        description: 'Ahri as a forest spirit with nature-themed effects.',
      },
      {
        id: 'ahri-spiritblossom',
        name: 'Spirit Blossom Ahri',
        image: '/placeholder.svg?height=200&width=350&text=Spirit+Blossom+Ahri',
        rarity: 'Legendary',
        releaseYear: 2020,
        description: 'Ahri as a spirit guide with new animations and voice lines.',
      },
      {
        id: 'ahri-kda-allout',
        name: 'K/DA ALL OUT Ahri',
        image: '/placeholder.svg?height=200&width=350&text=K/DA+ALL+OUT+Ahri',
        rarity: 'Epic',
        releaseYear: 2020,
        description: 'Ahri in K/DA\'s comeback with a new look.',
      },
      {
        id: 'ahri-coven',
        name: 'Coven Ahri',
        image: '/placeholder.svg?height=200&width=350&text=Coven+Ahri',
        rarity: 'Legendary',
        releaseYear: 2021,
        description: 'Ahri as a member of the Coven with dark, witch-like aesthetics.',
      },
      {
        id: 'ahri-arcana',
        name: 'Arcana Ahri',
        image: '/placeholder.svg?height=200&width=350&text=Arcana+Ahri',
        rarity: 'Epic',
        releaseYear: 2022,
        description: 'Ahri themed after tarot cards with mystical effects.',
      },
    ],
    selectedSkinId: 'ahri-default',
  },
  {
    id: 'yasuo',
    name: 'Yasuo',
    title: 'the Unforgiven',
    image: '/placeholder.svg?height=120&width=120&text=Yasuo',
    skins: [
      {
        id: 'yasuo-default',
        name: 'Default',
        image: '/placeholder.svg?height=200&width=350&text=Default+Yasuo',
        rarity: 'Common',
        releaseYear: 2013,
        description: 'The original Yasuo skin.',
      },
      {
        id: 'yasuo-high-noon',
        name: 'High Noon Yasuo',
        image: '/placeholder.svg?height=200&width=350&text=High+Noon+Yasuo',
        rarity: 'Epic',
        releaseYear: 2013,
        description: 'Yasuo in a Western-themed outfit.',
      },
      {
        id: 'yasuo-project',
        name: 'PROJECT: Yasuo',
        image: '/placeholder.svg?height=200&width=350&text=PROJECT+Yasuo',
        rarity: 'Epic',
        releaseYear: 2014,
        description: 'Yasuo as a futuristic cyborg warrior.',
      },
      {
        id: 'yasuo-blood-moon',
        name: 'Blood Moon Yasuo',
        image: '/placeholder.svg?height=200&width=350&text=Blood+Moon+Yasuo',
        rarity: 'Epic',
        releaseYear: 2016,
        description: 'Yasuo in a demonic Blood Moon mask.',
      },
      {
        id: 'yasuo-nightbringer',
        name: 'Nightbringer Yasuo',
        image: '/placeholder.svg?height=200&width=350&text=Nightbringer+Yasuo',
        rarity: 'Legendary',
        releaseYear: 2017,
        description: 'Yasuo as a dark entity with new animations and voice lines.',
      },
      {
        id: 'yasuo-odyssey',
        name: 'Odyssey Yasuo',
        image: '/placeholder.svg?height=200&width=350&text=Odyssey+Yasuo',
        rarity: 'Legendary',
        releaseYear: 2018,
        description: 'Yasuo as a space adventurer with new animations and voice lines.',
      },
      {
        id: 'yasuo-battle-boss',
        name: 'Battle Boss Yasuo',
        image: '/placeholder.svg?height=200&width=350&text=Battle+Boss+Yasuo',
        rarity: 'Epic',
        releaseYear: 2019,
        description: 'Yasuo as a video game villain with pixel effects.',
      },
      {
        id: 'yasuo-true-damage',
        name: 'True Damage Yasuo',
        image: '/placeholder.svg?height=200&width=350&text=True+Damage+Yasuo',
        rarity: 'Epic',
        releaseYear: 2019,
        description: 'Yasuo as a music producer for the True Damage group.',
      },
      {
        id: 'yasuo-spirit-blossom',
        name: 'Spirit Blossom Yasuo',
        image: '/placeholder.svg?height=200&width=350&text=Spirit+Blossom+Yasuo',
        rarity: 'Epic',
        releaseYear: 2020,
        description: 'Yasuo in a spiritual, anime-inspired design.',
      },
      {
        id: 'yasuo-truth-dragon',
        name: 'Truth Dragon Yasuo',
        image: '/placeholder.svg?height=200&width=350&text=Truth+Dragon+Yasuo',
        rarity: 'Legendary',
        releaseYear: 2021,
        description: 'Yasuo empowered by a celestial dragon with new animations and voice lines.',
      },
      {
        id: 'yasuo-dream-dragon',
        name: 'Dream Dragon Yasuo',
        image: '/placeholder.svg?height=200&width=350&text=Dream+Dragon+Yasuo',
        rarity: 'Legendary',
        releaseYear: 2021,
        description: 'An alternate version of Truth Dragon Yasuo with different colors.',
      },
    ],
    selectedSkinId: 'yasuo-default',
  },
  {
    id: 'lux',
    name: 'Lux',
    title: 'the Lady of Luminosity',
    image: '/placeholder.svg?height=120&width=120&text=Lux',
    skins: [
      {
        id: 'lux-default',
        name: 'Default',
        image: '/placeholder.svg?height=200&width=350&text=Default+Lux',
        rarity: 'Common',
        releaseYear: 2010,
        description: 'The original Lux skin.',
      },
      {
        id: 'lux-spellthief',
        name: 'Spellthief Lux',
        image: '/placeholder.svg?height=200&width=350&text=Spellthief+Lux',
        rarity: 'Common',
        releaseYear: 2010,
        description: 'Lux in a hooded, stealthy outfit.',
      },
      {
        id: 'lux-sorceress',
        name: 'Sorceress Lux',
        image: '/placeholder.svg?height=200&width=350&text=Sorceress+Lux',
        rarity: 'Common',
        releaseYear: 2010,
        description: 'Lux in a classic sorceress outfit.',
      },
      {
        id: 'lux-steel-legion',
        name: 'Steel Legion Lux',
        image: '/placeholder.svg?height=200&width=350&text=Steel+Legion+Lux',
        rarity: 'Epic',
        releaseYear: 2013,
        description: 'Lux in high-tech Demacian armor.',
      },
      {
        id: 'lux-star-guardian',
        name: 'Star Guardian Lux',
        image: '/placeholder.svg?height=200&width=350&text=Star+Guardian+Lux',
        rarity: 'Epic',
        releaseYear: 2015,
        description: 'Lux as a magical girl with colorful effects.',
      },
      {
        id: 'lux-elementalist',
        name: 'Elementalist Lux',
        image: '/placeholder.svg?height=200&width=350&text=Elementalist+Lux',
        rarity: 'Ultimate',
        releaseYear: 2016,
        description: 'Lux with 10 different elemental forms that can be transformed in-game.',
      },
      {
        id: 'lux-lunar-empress',
        name: 'Lunar Empress Lux',
        image: '/placeholder.svg?height=200&width=350&text=Lunar+Empress+Lux',
        rarity: 'Epic',
        releaseYear: 2018,
        description: 'Lux in a Lunar New Year-themed outfit with wolf motifs.',
      },
      {
        id: 'lux-pajama-guardian',
        name: 'Pajama Guardian Lux',
        image: '/placeholder.svg?height=200&width=350&text=Pajama+Guardian+Lux',
        rarity: 'Epic',
        releaseYear: 2018,
        description: 'Star Guardian Lux in cute pajamas.',
      },
      {
        id: 'lux-battle-academia',
        name: 'Battle Academia Lux',
        image: '/placeholder.svg?height=200&width=350&text=Battle+Academia+Lux',
        rarity: 'Epic',
        releaseYear: 2019,
        description: 'Lux as a student at the Battle Academia.',
      },
      {
        id: 'lux-cosmic',
        name: 'Cosmic Lux',
        image: '/placeholder.svg?height=200&width=350&text=Cosmic+Lux',
        rarity: 'Legendary',
        releaseYear: 2020,
        description: 'Lux as a cosmic entity with new animations and voice lines.',
      },
      {
        id: 'lux-dark-cosmic',
        name: 'Dark Cosmic Lux',
        image: '/placeholder.svg?height=200&width=350&text=Dark+Cosmic+Lux',
        rarity: 'Legendary',
        releaseYear: 2020,
        description: 'Lux as a corrupted cosmic entity with new animations and voice lines.',
      },
      {
        id: 'lux-space-groove',
        name: 'Space Groove Lux',
        image: '/placeholder.svg?height=200&width=350&text=Space+Groove+Lux',
        rarity: 'Epic',
        releaseYear: 2021,
        description: 'Lux in a funky, retro-futuristic space theme.',
      },
      {
        id: 'lux-porcelain',
        name: 'Porcelain Lux',
        image: '/placeholder.svg?height=200&width=350&text=Porcelain+Lux',
        rarity: 'Epic',
        releaseYear: 2022,
        description: 'Lux in an elegant porcelain-themed outfit.',
      },
    ],
    selectedSkinId: 'lux-default',
  },
];

// Helper function to get rarity color
const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'Common':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    case 'Epic':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
    case 'Legendary':
      return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400';
    case 'Ultimate':
      return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    case 'Mythic':
      return 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400';
    default:
      return 'bg-zinc-100 dark:bg-zinc-900/30 text-zinc-600 dark:text-zinc-400';
  }
};

export default function SkinsSelector() {
  const [champions, setChampions] = useState<Champion[]>(CHAMPIONS);
  const [activeChampion, setActiveChampion] = useState<Champion>(CHAMPIONS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [currentPage, setCurrentPage] = useState(1);
  const skinsPerPage = 8;

  // Filter skins based on search query and rarity filter
  const filteredSkins = activeChampion.skins.filter((skin) => {
    const matchesSearch = skin.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = rarityFilter === 'all' || skin.rarity === rarityFilter;
    return matchesSearch && matchesRarity;
  });

  // Sort skins based on sort option
  const sortedSkins = [...filteredSkins].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'rarity':
        // Sort by rarity hierarchy: Common, Epic, Legendary, Ultimate, Mythic
        const rarityOrder = { Common: 1, Epic: 2, Legendary: 3, Ultimate: 4, Mythic: 5 };
        return rarityOrder[a.rarity] - rarityOrder[b.rarity];
      case 'year':
        return (a.releaseYear || 0) - (b.releaseYear || 0);
      case 'year-desc':
        return (b.releaseYear || 0) - (a.releaseYear || 0);
      default:
        return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedSkins.length / skinsPerPage);
  const currentSkins = sortedSkins.slice((currentPage - 1) * skinsPerPage, currentPage * skinsPerPage);

  // Handle skin selection
  const handleSelectSkin = (skinId: string) => {
    const updatedChampions = champions.map((champion) => {
      if (champion.id === activeChampion.id) {
        return { ...champion, selectedSkinId: skinId };
      }
      return champion;
    });
    setChampions(updatedChampions);
    setActiveChampion({ ...activeChampion, selectedSkinId: skinId });
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setRarityFilter('all');
    setSortBy('name');
    setCurrentPage(1);
  };

  // Update current page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, rarityFilter, sortBy]);

  return (
    <TooltipProvider>
      <div className="w-full bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-md">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-6">Champion Skins Selector</h2>

          {/* Champion Tabs */}
          <Tabs
            defaultValue={activeChampion.id}
            onValueChange={(value) => {
              const champion = champions.find(c => c.id === value);
              if (champion) {
                setActiveChampion(champion);
                resetFilters();
              }
            }}
            className="mb-6"
          >
            <TabsList className="grid grid-cols-3 w-full">
              {champions.map(champion => (
                <TabsTrigger key={champion.id} value={champion.id} className="flex items-center gap-2">
                  <img
                    src={champion.image || '/placeholder.svg'}
                    alt={champion.name}
                    className="w-6 h-6 rounded-full object-cover"
                  />
                  <span>{champion.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {champions.map(champion => (
              <TabsContent key={champion.id} value={champion.id} className="mt-4">
                <div className="flex items-center gap-4 mb-6">
                  <img
                    src={champion.image || '/placeholder.svg'}
                    alt={champion.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{champion.name}</h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{champion.title}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                      {champion.skins.length}
                      {' '}
                      available skins
                    </p>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <Input
                placeholder="Search skins..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="flex gap-2">
              <Select value={rarityFilter} onValueChange={setRarityFilter}>
                <SelectTrigger className="w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter by rarity" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Rarities</SelectItem>
                  <SelectItem value="Common">Common</SelectItem>
                  <SelectItem value="Epic">Epic</SelectItem>
                  <SelectItem value="Legendary">Legendary</SelectItem>
                  <SelectItem value="Ultimate">Ultimate</SelectItem>
                  <SelectItem value="Mythic">Mythic</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name (A-Z)</SelectItem>
                  <SelectItem value="rarity">Rarity (Low to High)</SelectItem>
                  <SelectItem value="year">Release Year (Oldest)</SelectItem>
                  <SelectItem value="year-desc">Release Year (Newest)</SelectItem>
                </SelectContent>
              </Select>

              {(searchQuery || rarityFilter !== 'all' || sortBy !== 'name') && (
                <Button variant="outline" size="icon" onClick={resetFilters} title="Reset filters">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Results count */}
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Showing
            {' '}
            {currentSkins.length}
            {' '}
            of
            {filteredSkins.length}
            {' '}
            skins
            {filteredSkins.length !== activeChampion.skins.length && (
              <span>
                {' '}
                (filtered from
                {activeChampion.skins.length}
                )
              </span>
            )}
          </div>

          {/* Skins Grid */}
          {currentSkins.length > 0
            ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {currentSkins.map(skin => (
                    <Card
                      key={skin.id}
                      className={cn(
                        'cursor-pointer overflow-hidden transition-all duration-200 hover:shadow-md',
                        skin.id === activeChampion.selectedSkinId && 'ring-2 ring-blue-500 dark:ring-blue-400',
                      )}
                      onClick={() => handleSelectSkin(skin.id)}
                    >
                      <div className="relative">
                        <img src={skin.image || '/placeholder.svg'} alt={skin.name} className="w-full h-48 object-cover" />
                        <Badge className={cn('absolute top-2 right-2 text-xs', getRarityColor(skin.rarity))}>
                          {skin.rarity}
                        </Badge>
                        {skin.id === activeChampion.selectedSkinId && (
                          <div className="absolute top-2 left-2 bg-blue-500 text-white rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                        {skin.releaseYear && (
                          <Badge
                            variant="outline"
                            className="absolute bottom-2 left-2 bg-black/50 text-white border-none text-xs"
                          >
                            {skin.releaseYear}
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">{skin.name}</h4>
                          {skin.description && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-zinc-400 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-xs">{skin.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            : (
                <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-800/30 rounded-lg mb-6">
                  <Star className="h-12 w-12 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">No skins found</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-6">
                    {searchQuery ? `No skins match "${searchQuery}"` : 'No skins match the selected filters.'}
                  </p>
                  <Button onClick={resetFilters}>Reset Filters</Button>
                </div>
              )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                Page
                {' '}
                {currentPage}
                {' '}
                of
                {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Selected Skin Summary */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 p-6 bg-zinc-50 dark:bg-zinc-800/30">
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4">Selected Skin</h3>

          <div className="flex flex-col md:flex-row gap-6">
            {champions.map((champion) => {
              const selectedSkin = champion.skins.find(skin => skin.id === champion.selectedSkinId);
              return (
                <div key={champion.id} className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={champion.image || '/placeholder.svg'}
                      alt={champion.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{champion.name}</h4>
                  </div>

                  {selectedSkin && (
                    <Card className="overflow-hidden">
                      <img
                        src={selectedSkin.image || '/placeholder.svg'}
                        alt={selectedSkin.name}
                        className="w-full h-32 object-cover"
                      />
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{selectedSkin.name}</p>
                            <Badge className={cn('mt-1 text-xs', getRarityColor(selectedSkin.rarity))}>
                              {selectedSkin.rarity}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs"
                            onClick={() => setActiveChampion(champion)}
                          >
                            Change
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end mt-6">
            <Button
              variant="outline"
              className="mr-2"
              onClick={() => {
                // Reset all champions to default skins
                const resetChampions = champions.map(champion => ({
                  ...champion,
                  selectedSkinId: `${champion.id}-default`,
                }));
                setChampions(resetChampions);
                setActiveChampion({
                  ...activeChampion,
                  selectedSkinId: `${activeChampion.id}-default`,
                });
              }}
            >
              Reset All
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">Save Selection</Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
