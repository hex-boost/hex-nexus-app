import type { Champion, Chroma, Skin, UserPreferences } from '@/components/character-selection';
import type { SkinHistoryEntry } from '@/features/skin-selector/skin-history.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Input } from '@/components/ui/input.tsx';
import SkinHistory, { addToSkinHistory } from '@/features/skin-selector/skin-history.tsx';
import SkinTags from '@/features/skin-selector/skin-tags.tsx';
import { useLocalStorage } from '@/hooks/use-local-storage.tsx';
import { Search, X } from 'lucide-react';
import { useState } from 'react';

type SkinSelectorPageProps = {
  champions: Champion[];
  onSelectSkin: (champion: Champion, skin: Skin, chroma?: Chroma | null) => void;
  initialChampionId?: number;
  initialSkinId?: number;
};

export default function SkinSelectorPage({
  champions,
  onSelectSkin,
  initialChampionId,
  initialSkinId,
}: SkinSelectorPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [skinHistory, setSkinHistory] = useLocalStorage<SkinHistoryEntry[]>('skin-history', []);
  const [userPreferences] = useLocalStorage<UserPreferences>('champion-preferences', {});

  // Find initial champion and skin if provided
  const initialChampion = initialChampionId ? champions.find(c => c.id === initialChampionId) : null;

  const initialSkin
    = initialChampion && initialSkinId ? initialChampion.skins.find(s => s.id === initialSkinId) : null;

  // Set up state for selected champion and skin
  const [selectedChampion, setSelectedChampion] = useState<Champion | null>(initialChampion);
  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(initialSkin);
  const [selectedChroma, setSelectedChroma] = useState<Chroma | null>(null);

  // Handle tag selection
  const handleTagSelect = (tagId: string) => {
    setSelectedTags(prev => (prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]));
  };

  // Clear all selected tags
  const clearTags = () => {
    setSelectedTags([]);
  };

  // Clear search history
  const clearHistory = () => {
    setSkinHistory([]);
  };

  // Handle skin selection from history
  const handleSelectFromHistory = (championId: number, skinId: number) => {
    const champion = champions.find(c => c.id === championId);
    if (!champion) {
      return;
    }

    const skin = champion.skins.find(s => s.id === skinId);
    if (!skin) {
      return;
    }

    setSelectedChampion(champion);
    setSelectedSkin(skin);
    setSelectedChroma(null);
  };

  // Handle final skin selection
  const handleConfirmSelection = () => {
    if (!selectedChampion || !selectedSkin) {
      return;
    }

    // Add to history
    addToSkinHistory(selectedChampion, selectedSkin, setSkinHistory);

    // Pass selection back to parent
    onSelectSkin(selectedChampion, selectedSkin, selectedChroma);
  };

  // Filter champions and skins based on search and tags
  const filteredChampions = champions.filter((champion) => {
    // Filter by search query
    if (searchQuery && !champion.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // If no tags selected, include all champions
    if (selectedTags.length === 0) {
      return true;
    }

    // Check if any skin matches the selected tags
    return champion.skins.some((skin) => {
      // Check skin line tags
      const skinLineTags = selectedTags.filter(tag => tag.startsWith('skin-line-'));
      if (
        skinLineTags.length > 0
        && !skinLineTags.some(tag => tag === `skin-line-${skin.skinLine.toLowerCase().replace(/\s+/g, '-')}`)
      ) {
        return false;
      }

      // Check rarity tags
      const rarityTags = selectedTags.filter(tag =>
        ['common', 'epic', 'legendary', 'ultimate', 'mythic'].includes(tag),
      );
      if (rarityTags.length > 0 && !rarityTags.includes(skin.rarity.toLowerCase())) {
        return false;
      }

      // Check year tags
      const yearTags = selectedTags.filter(tag => /^\d{4}$/.test(tag) || tag === 'legacy');
      if (yearTags.length > 0) {
        const skinYear = new Date(skin.releaseDate).getFullYear().toString();
        if (!yearTags.includes(skinYear) && !(yearTags.includes('legacy') && Number.parseInt(skinYear) < 2015)) {
          return false;
        }
      }

      // Check feature tags
      if (selectedTags.includes('has-chromas') && !skin.chromas?.length) {
        return false;
      }
      if (selectedTags.includes('has-video') && !skin.webm) {
        return false;
      }
      if (selectedTags.includes('has-3d') && !skin.model3d) {
        return false;
      }

      return true;
    });
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search and filters */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search champions or skins..."
            className="pl-8 bg-shade8 border-shade7 text-foreground"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
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
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* History section */}
        <SkinHistory onSelectSkin={handleSelectFromHistory} onClearHistory={clearHistory} />

        {/* Tags section */}
        <SkinTags selectedTags={selectedTags} onTagSelect={handleTagSelect} onClearTags={clearTags} />

        {/* Champions and skins grid */}
        {/* Implementation would go here */}

        {/* Selection confirmation */}
        {selectedChampion && selectedSkin && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-shade9 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">
                  {selectedChampion.name}
                  {' '}
                  -
                  {selectedSkin.name}
                </h3>
                {selectedChroma && (
                  <p className="text-sm text-muted-foreground">
                    {selectedChroma.name}
                    {' '}
                    Chroma
                  </p>
                )}
              </div>
              <Button onClick={handleConfirmSelection}>Confirm Selection</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
