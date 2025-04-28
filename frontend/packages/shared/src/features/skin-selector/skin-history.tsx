import type { Champion, Skin } from '@/features/skin-selector/components/character-selection.tsx';

import type React from 'react';
import { Button } from '@/components/ui/button.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { motion } from 'framer-motion';
import { Clock, Search, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export type SkinHistoryEntry = {
  id: string;
  championId: number;
  championName: string;
  skinId: number;
  skinName: string;
  skinImage: string;
  timestamp: number;
};

export type SearchHistoryItem = {
  id: string;
  query: string;
  timestamp: number;
  tags?: string[];
};

type SkinHistoryProps = {
  onSelectSkin: (championId: number, skinId: number) => void;
  onClearHistory?: () => void;
};

export function SkinHistory({ onSelectSkin, onClearHistory }: SkinHistoryProps) {
  const [history, setHistory] = useState<SkinHistoryEntry[]>([]);

  // Load history from localStorage only once on mount
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem('skin-history');
      if (storedHistory) {
        setHistory(JSON.parse(storedHistory));
      }
    } catch (error) {
      console.error('Failed to parse skin history:', error);
    }
  }, []);

  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center gap-1">
          <Clock className="h-4 w-4" />
          Recently Viewed
        </h3>
        {onClearHistory && (
          <Button variant="ghost" size="sm" onClick={onClearHistory} className="h-7 text-xs">
            <Trash2 className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <ScrollArea className="pb-2">
        <div className="flex gap-2 pb-2">
          {history.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex-shrink-0 w-16 h-20 cursor-pointer group"
              onClick={() => onSelectSkin(entry.championId, entry.skinId)}
            >
              <div className="relative w-16 h-16 rounded-md overflow-hidden mb-1">
                <img
                  src={entry.skinImage || '/placeholder.svg'}
                  alt={`${entry.championName} - ${entry.skinName}`}
                  className="object-cover transition-transform group-hover:scale-110"
                  sizes="64px"
                />
              </div>
              <p className="text-[10px] text-center truncate">{entry.skinName}</p>
            </motion.div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

// Helper function to add a skin to history
export function addToSkinHistory(
  champion: Champion,
  skin: Skin,
  setHistory: React.Dispatch<React.SetStateAction<SkinHistoryEntry[]>>,
) {
  const newEntry: SkinHistoryEntry = {
    id: `${champion.id}-${skin.id}-${Date.now()}`,
    championId: champion.id,
    championName: champion.name,
    skinId: skin.id,
    skinName: skin.name,
    skinImage: skin.image,
    timestamp: Date.now(),
  };

  // Update state and localStorage
  setHistory((prev) => {
    // Remove duplicates of the same skin
    const filtered = prev.filter(item => !(item.championId === champion.id && item.skinId === skin.id));
    // Add new entry at the beginning and limit to 10 items
    const updated = [newEntry, ...filtered].slice(0, 10);

    // Save to localStorage
    try {
      localStorage.setItem('skin-history', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save skin history to localStorage:', error);
    }

    return updated;
  });
}

type SkinSearchHistoryProps = {
  onSelectQuery: (query: string) => void;
};

export function SkinSearchHistory({ onSelectQuery }: SkinSearchHistoryProps) {
  const [history, setHistory] = useState<SearchHistoryItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load search history from localStorage only once on mount
  useEffect(() => {
    if (!isInitialized) {
      try {
        const storedHistory = localStorage.getItem('skin-search-history');
        if (storedHistory) {
          setHistory(JSON.parse(storedHistory));
        }
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to parse search history:', error);
        setIsInitialized(true);
      }
    }
  }, [isInitialized]);

  const handleClearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem('skin-search-history');
    } catch (error) {
      console.error('Failed to clear search history from localStorage:', error);
    }
  }, []);

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No search history</p>
        <p className="text-xs">Your recent searches will appear here</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">Recent Searches</h3>
        <Button variant="ghost" size="sm" onClick={handleClearHistory} className="h-7 text-xs">
          <Trash2 className="h-3 w-3 mr-1" />
          Clear
        </Button>
      </div>

      <div className="space-y-1">
        {history.map(item => (
          <div
            key={item.id}
            className="flex items-center p-2 rounded-md hover:bg-accent/10 cursor-pointer"
            onClick={() => onSelectQuery(item.query)}
          >
            <Search className="h-3 w-3 mr-2 text-muted-foreground" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{item.query}</p>
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-accent/20 rounded-sm text-[10px] text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{formatTimeAgo(item.timestamp)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function to format time ago
function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const seconds = Math.floor((now - timestamp) / 1000);

  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}
