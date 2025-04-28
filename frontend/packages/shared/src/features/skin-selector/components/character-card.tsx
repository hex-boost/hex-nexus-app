'use client';

import type { Champion, Chroma, Skin, SkinTag } from '@/components/character-selection';
import { Badge } from '@/components/ui/badge.tsx';
import { cn } from '@/lib/utils.ts';
import Image from 'next/image';

type CharacterCardProps = {
  champion: Champion;
  onClick?: () => void;
  featured?: boolean;
  selectedSkin?: Skin;
  selectedChroma?: Chroma | null;
  layout?: 'grid' | 'list' | 'compact';
  size?: 'small' | 'medium' | 'large';
  tags?: SkinTag[];
};

export default function CharacterCard({
  champion,
  onClick,
  featured = false,
  selectedSkin,
  selectedChroma,
  layout = 'grid',
  size = 'medium',
  tags = [],
}: CharacterCardProps) {
  // Use selected skin if available, otherwise use default champion image
  const displaySkin = selectedSkin || champion.skins[0];
  const displayImage = selectedChroma ? selectedChroma.image : displaySkin.image;

  // Determine card height based on size and featured status
  const getCardHeight = () => {
    if (featured) {
      return 'h-[220px]';
    }

    switch (size) {
      case 'small':
        return 'h-[140px]';
      case 'large':
        return 'h-[220px]';
      default:
        return 'h-[180px]';
    }
  };

  // List layout
  if (layout === 'list') {
    return (
      <div
        className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors hover:bg-shade8 border border-transparent hover:border-border"
        onClick={onClick}
      >
        <div className="relative w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
          <Image
            src={displayImage || '/placeholder.svg'}
            alt={champion.name}
            className="object-cover"
            fill
            sizes="48px"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{champion.name}</h3>
          {selectedSkin && selectedSkin.id !== champion.skins[0].id && (
            <p className="text-xs text-muted-foreground truncate">
              {selectedSkin.name}
              {' '}
              {selectedChroma ? `(${selectedChroma.name})` : ''}
            </p>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {tags.map(tag => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="text-[10px] px-1 py-0"
                  style={{ borderColor: tag.color, color: tag.color }}
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {selectedSkin && selectedSkin.id !== champion.skins[0].id && (
          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" title={`${selectedSkin.name} skin selected`} />
        )}
      </div>
    );
  }

  // Grid or compact layout
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg cursor-pointer transition-all',
        'shadow-lg group',
        getCardHeight(),
        layout === 'compact' ? 'aspect-square' : 'aspect-auto',
      )}
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-shade10 via-transparent to-transparent z-10" />

      {/* Champion image */}
      <div className="absolute inset-0 bg-shade8">
        <Image
          src={displayImage || '/placeholder.svg'}
          alt={champion.name}
          className="object-cover transition-transform group-hover:scale-105"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      {/* Skin indicator */}
      {selectedSkin && selectedSkin.id !== champion.skins[0].id && (
        <div className="absolute top-2 right-2 z-20">
          <div className="w-3 h-3 rounded-full bg-primary" title={`${selectedSkin.name} skin selected`} />
        </div>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="absolute top-2 left-2 z-20 flex flex-wrap gap-1 max-w-[70%]">
          {tags.map(tag => (
            <Badge
              key={tag.id}
              variant="outline"
              className="text-xs px-1.5 py-0 bg-shade10/80 backdrop-blur-sm"
              style={{ borderColor: tag.color, color: tag.color }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Champion name */}
      <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
        <h3 className="text-foreground font-semibold text-base">{champion.name}</h3>
        {selectedSkin && selectedSkin.id !== champion.skins[0].id && (
          <p className="text-xs text-muted-foreground truncate">
            {selectedSkin.name}
            {' '}
            {selectedChroma ? `(${selectedChroma.name})` : ''}
          </p>
        )}
      </div>
    </div>
  );
}
