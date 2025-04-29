// character-card.tsx
import type {FormattedChampion, FormattedSkin} from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import {ProgressiveBlur} from '@/components/ui/progressive-blur.tsx';
import {Skeleton} from '@/components/ui/skeleton';
import {cn} from '@/lib/utils';

type CharacterCardProps = {
  champion?: FormattedChampion;
  selectedSkin?: FormattedSkin;
  skin?: FormattedSkin; // Added skin prop
  onClick?: () => void;
  isSelected?: boolean;
  isLoading?: boolean;
};

export default function CharacterCard({
  champion,
  selectedSkin,
  skin, // Added skin prop
  onClick,
  isSelected,
  isLoading,
}: CharacterCardProps) {
  if (isLoading || (!champion && !skin)) {
    return (
      <div className={cn('aspect-square w-full rounded-[4px] overflow-hidden')}>
        <Skeleton className="h-full w-full rounded-none" />
        <div className="absolute bottom-0 left-0 w-full">
          <div className="flex flex-col items-start gap-0 px-5 py-4">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16 mt-1" />
          </div>
        </div>
      </div>
    );
  }

  // Handle both champion and skin cases
  let displayImage: string;
  let primaryName: string;
  let secondaryName: string | undefined;

  if (skin) {
    // Skin view
    displayImage = skin.imageUrl;
    primaryName = skin.champion;
    secondaryName = skin.name;
  } else if (champion) {
    // Champion view
    displayImage = selectedSkin?.imageUrl || champion.skins[0]?.imageUrl;
    primaryName = champion.name;
    secondaryName = selectedSkin?.name !== champion.name ? selectedSkin?.name : undefined;
  } else {
    // Fallback (shouldn't happen due to the first check)
    displayImage = '';
    primaryName = 'Unknown';
    secondaryName = undefined;
  }

  return (
    <button
      className={cn(
        'relative aspect-square w-full rounded-[4px] overflow-hidden transition-transform duration-150 hover:scale-105',
        isSelected && 'ring-2 ring-primary scale-100',
      )}
      onClick={onClick}
    >
      <img
        src={displayImage}
        alt={primaryName}
        className="h-full w-full object-cover"
      />
      <ProgressiveBlur className="absolute bottom-0 left-0 h-[32%] w-full" blurIntensity={5} />
      <div className="absolute bottom-0 left-0 w-full">
        <div className="flex flex-col items-start gap-0 px-5 py-4">
          <p className="text-base font-bold text-white">{primaryName}</p>
          {secondaryName && (
            <span className="text-sm text-zinc-300 uppercase truncate">
              {secondaryName.toLowerCase().includes(primaryName.toLowerCase())
                ? secondaryName.replace(new RegExp(primaryName, 'i'), '').trim()
                : secondaryName}
            </span>
          )}
        </div>
      </div>

      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary rounded-full w-6 h-6 flex items-center justify-center">
          <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
    </button>
  );
}
