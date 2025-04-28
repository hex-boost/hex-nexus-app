'use client';

import type { Champion, Skin } from '@/components/character-selection';
import { cn } from '@/lib/utils.ts';
import Image from 'next/image';
import { useState } from 'react';

type AlphabetSidebarProps = {
  champions: Champion[];
  onSelectChampion: (champion: Champion) => void;
  userPreferences: {
    [championId: number]: {
      selectedSkinId: number;
      selectedChromaId?: number;
    };
  };
  getSelectedSkin: (champion: Champion) => Skin;
  getTagsForSkin?: (skinId: number) => SkinTag[];
};

// Define SkinTag type (or import it if available)
type SkinTag = {
  id: number;
  name: string;
};

export default function AlphabetSidebar({
  champions,
  onSelectChampion,
  userPreferences,
  getSelectedSkin,
  getTagsForSkin,
}: AlphabetSidebarProps) {
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);

  // Generate alphabet
  const alphabet = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

  // Get unique first letters from champion names
  const availableLetters = [...new Set(champions.map(champ => champ.name[0].toUpperCase()))];

  return (
    <div className="flex-1 flex">
      {/* Alphabet list */}
      <div className="w-8 bg-shade10 flex flex-col items-center py-2">
        {alphabet.map((letter) => {
          const isAvailable = availableLetters.includes(letter);
          return (
            <button
              key={letter}
              className={cn(
                'w-full h-8 flex items-center justify-center text-xs font-medium',
                isAvailable ? 'text-foreground hover:text-primary' : 'text-muted-foreground opacity-50',
                selectedLetter === letter ? 'bg-shade8 text-primary' : '',
              )}
              onClick={() => setSelectedLetter(letter)}
              disabled={!isAvailable}
            >
              {letter}
            </button>
          );
        })}
      </div>

      {/* Champion list */}
      <div className="flex-1 py-2 overflow-y-auto">
        {champions
          .filter(champ => !selectedLetter || champ.name[0].toUpperCase() === selectedLetter)
          .map((champion) => {
            // Get the selected skin for this champion
            const selectedSkin = getSelectedSkin(champion);
            const hasCustomSkin = selectedSkin.id !== champion.skins[0].id;

            return (
              <div
                key={champion.id}
                className="flex items-center px-4 py-2 hover:bg-shade8 cursor-pointer transition-colors"
                onClick={() => onSelectChampion(champion)}
              >
                <div className="w-8 h-8 rounded-full bg-shade7 overflow-hidden mr-3 flex-shrink-0 relative">
                  <Image
                    src={selectedSkin.image || '/placeholder.svg'}
                    alt={champion.name}
                    className="object-cover"
                    fill
                    sizes="32px"
                  />
                  {hasCustomSkin && <div className="absolute bottom-0 right-0 w-2 h-2 bg-primary rounded-full" />}
                </div>
                <span className="text-sm text-foreground">{champion.name}</span>
                {hasCustomSkin && (
                  <span className="ml-auto text-xs text-muted-foreground truncate max-w-[60px]">
                    {selectedSkin.name}
                  </span>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
