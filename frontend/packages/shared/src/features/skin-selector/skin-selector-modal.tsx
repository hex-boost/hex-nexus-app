import type { SearchHistoryItem } from './skin-history.tsx';

import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog.tsx';
import { Input } from '@/components/ui/input.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage.tsx';
import { ChevronLeft, Clock, CuboidIcon as Cube, Grid3X3, ImageIcon, LayoutGrid, Search, Tag, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { SkinCategories } from './skin-categories.tsx';
import { SkinSearchHistory } from './skin-history.tsx';
import { SkinTags } from './skin-tags.tsx';

export type Skin = {
  id: string;
  name: string;
  championId: string;
  championName: string;
  imageUrl: string;
  price: number;
  rarity: string;
  releaseDate: string;
  tags: string[];
  description?: string;
  modelUrl?: string;
  videoUrl?: string;
};

type SkinSelectorModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelectSkin: (skin: Skin) => void;
  initialChampionId?: string;
  skins: Skin[];
};

export function SkinSelectorModal({ isOpen, onClose, onSelectSkin, initialChampionId, skins }: SkinSelectorModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [mediaType, setMediaType] = useState<'image' | '3d'>('image');
  const [filteredSkins, setFilteredSkins] = useState<Skin[]>(skins);
  const [searchHistory, setSearchHistory] = useLocalStorage<SearchHistoryItem[]>('skin-search-history', []);
  const [tagUsage, setTagUsage] = useLocalStorage<Record<string, number>>('tag-usage-count', {});
  const [recentlyViewed, setRecentlyViewed] = useLocalStorage<string[]>('recently-viewed-skins', []);
  const [activeTab, setActiveTab] = useState('browse');

  // Filter skins based on search, tags, and category - memoize the filter function
  const filterSkins = useMemo(() => {
    let results = [...skins];

    // Filter by champion if specified
    if (initialChampionId) {
      results = results.filter(skin => skin.championId === initialChampionId);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        skin =>
          skin.name.toLowerCase().includes(query)
          || skin.championName.toLowerCase().includes(query)
          || skin.description?.toLowerCase().includes(query)
          || skin.tags.some(tag => tag.toLowerCase().includes(query)),
      );
    }

    // Filter by selected tags
    if (selectedTags.length > 0) {
      results = results.filter(skin => selectedTags.every(tag => skin.tags.includes(tag)));
    }

    // Filter by category
    if (selectedCategory) {
      switch (selectedCategory) {
        case 'recent':
          results = results
            .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime())
            .slice(0, 20);
          break;
        case 'popular':
          // In a real app, this would use actual popularity data
          // Using a stable sort to avoid re-renders
          results = [...results].sort((a, b) => a.name.localeCompare(b.name)).slice(0, 24);
          break;
        case 'sale':
          // In a real app, this would filter by actual sale status
          results = results.filter(skin => Number.parseInt(skin.id) % 5 === 0);
          break;
        case 'legendary':
          results = results.filter(skin => skin.rarity.toLowerCase() === 'legendary');
          break;
        case 'ultimate':
          results = results.filter(skin => skin.rarity.toLowerCase() === 'ultimate');
          break;
        // Add more category filters as needed
      }
    }

    return results;
  }, [searchQuery, selectedTags, selectedCategory, skins, initialChampionId]);

  // Update filtered skins when filter criteria change
  useEffect(() => {
    setFilteredSkins(filterSkins);
  }, [filterSkins]);

  // Update tag usage counts when selected tags change - but only when tags are actually selected
  // Use a ref to track if this is the first render
  const isFirstRender = useMemo(() => ({ current: true }), []);

  useEffect(() => {
    // Skip the first render to avoid unnecessary updates
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (selectedTags.length > 0) {
      setTagUsage((prevTagUsage) => {
        const newTagUsage = { ...prevTagUsage };
        let hasChanges = false;

        selectedTags.forEach((tag) => {
          if (!newTagUsage[tag] || newTagUsage[tag] === 0) {
            newTagUsage[tag] = 1;
            hasChanges = true;
          }
        });

        // Only return a new object if there are actual changes
        return hasChanges ? newTagUsage : prevTagUsage;
      });
    }
  }, [selectedTags, setTagUsage]);

  // Save search to history when search is performed
  const saveSearchToHistory = useCallback(() => {
    if (!searchQuery.trim()) {
      return;
    }

    const newSearchItem: SearchHistoryItem = {
      id: uuidv4(),
      query: searchQuery,
      timestamp: Date.now(),
      tags: selectedTags.length > 0 ? [...selectedTags] : undefined,
    };

    // Add to beginning, remove duplicates, limit to 20 items
    setSearchHistory((prev) => {
      const updatedHistory = [newSearchItem, ...prev.filter(item => item.query !== searchQuery)].slice(0, 20);
      return updatedHistory;
    });
  }, [searchQuery, selectedTags, setSearchHistory]);

  const handleSelectSkin = useCallback(
    (skin: Skin) => {
      // Add to recently viewed
      setRecentlyViewed((prev) => {
        const updated = [skin.id, ...prev.filter(id => id !== skin.id)].slice(0, 10);
        return updated;
      });

      onSelectSkin(skin);
      onClose();
    },
    [onSelectSkin, onClose, setRecentlyViewed],
  );

  const handleTagSelect = useCallback((tagId: string) => {
    setSelectedTags(prev => (prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]));
  }, []);

  const handleSelectCategory = useCallback((categoryId: string) => {
    setSelectedCategory(prev => (prev === categoryId ? null : categoryId));
  }, []);

  const handleSelectSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    setActiveTab('browse');
  }, []);

  const handleSearch = useCallback(() => {
    saveSearchToHistory();
    setActiveTab('browse');
  }, [saveSearchToHistory]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedTags([]);
    setSelectedCategory(null);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-5xl h-[80vh] max-h-[800px] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur border-accent/20">
        <DialogHeader className="p-4 border-b border-accent/10 sticky top-0 z-10 bg-background/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Back</span>
              </Button>
              <DialogTitle>Skin Selector</DialogTitle>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={mediaType === 'image' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none h-8 px-2"
                  onClick={() => setMediaType('image')}
                >
                  <ImageIcon className="h-4 w-4 mr-1" />
                  2D
                </Button>
                <Button
                  variant={mediaType === '3d' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none h-8 px-2"
                  onClick={() => setMediaType('3d')}
                >
                  <Cube className="h-4 w-4 mr-1" />
                  3D
                </Button>
              </div>
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none h-8 px-2"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="h-4 w-4" />
                  <span className="sr-only">Grid View</span>
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  className="rounded-none h-8 px-2"
                  onClick={() => setViewMode('list')}
                >
                  <LayoutGrid className="h-4 w-4" />
                  <span className="sr-only">List View</span>
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skins by name, champion, or tags..."
                className="pl-9 h-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Clear</span>
                </Button>
              )}
            </div>
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {(searchQuery || selectedTags.length > 0 || selectedCategory) && (
            <div className="flex items-center gap-2 mt-2">
              <div className="text-sm text-muted-foreground">Filters:</div>
              {searchQuery && (
                <Badge onClose={() => setSearchQuery('')}>
                  "
                  {searchQuery}
                  "
                </Badge>
              )}
              {selectedTags.map(tag => (
                <Badge key={tag} onClose={() => handleTagSelect(tag)}>
                  {tag}
                </Badge>
              ))}
              {selectedCategory && <Badge onClose={() => setSelectedCategory(null)}>{selectedCategory}</Badge>}
              <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          )}
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r border-accent/10 p-4 overflow-y-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="browse" className="flex-1">
                  <Tag className="h-4 w-4 mr-1" />
                  Browse
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1">
                  <Clock className="h-4 w-4 mr-1" />
                  History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="browse" className="m-0">
                <div className="space-y-6">
                  <SkinTags selectedTags={selectedTags} onTagSelect={handleTagSelect} />

                  <SkinCategories selectedCategory={selectedCategory} onSelectCategory={handleSelectCategory} />
                </div>
              </TabsContent>

              <TabsContent value="history" className="m-0">
                <SkinSearchHistory onSelectQuery={handleSelectSearchQuery} />
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4">
                {filteredSkins.length === 0
                  ? (
                      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                        <Search className="h-10 w-10 mb-4 opacity-50" />
                        <p className="text-lg font-medium">No skins found</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    )
                  : (
                      <div className="grid grid-cols-3 gap-4">
                        {filteredSkins.map(skin => (
                          <div
                            key={skin.id}
                            className="bg-card rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => handleSelectSkin(skin)}
                          >
                            <div className="aspect-square relative">
                              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10" />
                              <div className="absolute bottom-2 left-2 z-20 text-white">
                                <p className="font-medium">{skin.name}</p>
                                <p className="text-xs opacity-80">{skin.championName}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
