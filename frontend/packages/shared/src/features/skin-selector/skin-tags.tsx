'use client';

import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { motion } from 'framer-motion';
import { Tag, X } from 'lucide-react';
import { useMemo } from 'react';

// Common skin tags
const COMMON_TAGS = [
  { id: 'legendary', name: 'Legendary', color: '#FF9800' },
  { id: 'epic', name: 'Epic', color: '#9C27B0' },
  { id: 'mythic', name: 'Mythic', color: '#E91E63' },
  { id: 'ultimate', name: 'Ultimate', color: '#F44336' },
  { id: 'common', name: 'Common', color: '#607D8B' },
  { id: 'has-chromas', name: 'Has Chromas', color: '#2196F3' },
  { id: 'has-video', name: 'Has Video', color: '#4CAF50' },
  { id: 'has-3d', name: 'Has 3D Model', color: '#00BCD4' },
  { id: 'legacy', name: 'Legacy', color: '#795548' },
];

// Skin lines
const SKIN_LINES = [
  { id: 'skin-line-star-guardian', name: 'Star Guardian', color: '#F48FB1' },
  { id: 'skin-line-project', name: 'PROJECT', color: '#FF5252' },
  { id: 'skin-line-cosmic', name: 'Cosmic', color: '#7986CB' },
  { id: 'skin-line-battle-academia', name: 'Battle Academia', color: '#FFD54F' },
  { id: 'skin-line-pulsefire', name: 'Pulsefire', color: '#4FC3F7' },
  { id: 'skin-line-winter-wonder', name: 'Winter Wonder', color: '#B3E5FC' },
  { id: 'skin-line-blackfrost', name: 'Blackfrost', color: '#90CAF9' },
  { id: 'skin-line-hextech', name: 'Hextech', color: '#CE93D8' },
];

// Years
const YEARS = [
  { id: '2023', name: '2023', color: '#4CAF50' },
  { id: '2022', name: '2022', color: '#2196F3' },
  { id: '2021', name: '2021', color: '#9C27B0' },
  { id: '2020', name: '2020', color: '#FF9800' },
  { id: '2019', name: '2019', color: '#F44336' },
];

type SkinTagsProps = {
  selectedTags: string[];
  onTagSelect: (tagId: string) => void;
  onClearTags?: () => void;
};

export function SkinTags({ selectedTags, onTagSelect, onClearTags }: SkinTagsProps) {
  const tagGroups = [
    {
      title: 'Rarity',
      tags: COMMON_TAGS.filter(tag => ['legendary', 'epic', 'mythic', 'ultimate', 'common'].includes(tag.id)),
    },
    {
      title: 'Features',
      tags: COMMON_TAGS.filter(tag => ['has-chromas', 'has-video', 'has-3d', 'legacy'].includes(tag.id)),
    },
    { title: 'Skin Lines', tags: SKIN_LINES },
    { title: 'Release Year', tags: YEARS },
  ];

  // Memoize the tag groups to prevent unnecessary re-renders
  const memoizedTagGroups = useMemo(() => tagGroups, []);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium flex items-center gap-1">
          <Tag className="h-4 w-4" />
          Filter by Tags
        </h3>
        {selectedTags.length > 0 && onClearTags && (
          <Button variant="ghost" size="sm" onClick={onClearTags} className="h-7 text-xs">
            <X className="h-3 w-3 mr-1" />
            Clear Filters
          </Button>
        )}
      </div>

      {selectedTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {selectedTags.map((tagId) => {
            const tag = [...COMMON_TAGS, ...SKIN_LINES, ...YEARS].find(t => t.id === tagId);
            if (!tag) {
              return null;
            }

            return (
              <Badge
                key={tag.id}
                variant="outline"
                className="cursor-pointer"
                style={{ borderColor: tag.color, color: tag.color }}
                onClick={() => onTagSelect(tag.id)}
              >
                {tag.name}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            );
          })}
        </div>
      )}

      <ScrollArea className="max-h-40">
        <div className="space-y-3">
          {memoizedTagGroups.map(group => (
            <div key={group.title} className="space-y-1">
              <h4 className="text-xs text-muted-foreground">{group.title}</h4>
              <div className="flex flex-wrap gap-1">
                {group.tags.map(tag => (
                  <motion.div key={tag.id} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Badge
                      variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      style={{
                        backgroundColor: selectedTags.includes(tag.id) ? tag.color : 'transparent',
                        borderColor: tag.color,
                        color: selectedTags.includes(tag.id) ? 'white' : tag.color,
                      }}
                      onClick={() => onTagSelect(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
