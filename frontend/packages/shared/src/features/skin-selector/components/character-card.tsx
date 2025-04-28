import type {FormattedChampion, FormattedSkin} from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import {ProgressiveBlur} from '@/components/ui/progressive-blur.tsx';
import {cn} from '@/lib/utils';

type CharacterCardProps = {
  champion?: FormattedChampion;
  skin?: FormattedSkin;
  selectedSkin?: FormattedSkin;
  onClick?: () => void;
  isSelected?: boolean;
  onBack?: () => void;
};

export default function CharacterCard({
  champion,
  skin,
  selectedSkin,
  onClick,
  isSelected,
}: CharacterCardProps) {
  // Use the appropriate image based on whether this is a champion or skin card
  const displayImage = skin?.imageUrl || (selectedSkin?.imageUrl || (champion?.skins[0]?.imageUrl));
  const displayName = skin?.name || champion?.name || '';
  const subtext = !skin && selectedSkin?.name;

  return (
    <button
      className={cn(
        'relative aspect-square w-full overflow-hidden rounded-[4px] overflow-hidden',
        isSelected && 'ring-2 ring-primary',
      )}
      onClick={onClick}
    >

      <img
        src={displayImage}
        alt={displayName}
        className="h-full w-full object-cover transition-transform group-hover:scale-140"
      />
      <ProgressiveBlur
        className="pointer-events-none absolute bottom-0 left-0 h-[36%] w-full"
        blurIntensity={5}
      />
      <div className="absolute bottom-0 left-0 w-full">
        <div className="flex flex-col items-start gap-0 px-5 py-4">
          <p className="text-base font-medium text-white">{displayName}</p>
          {subtext && <span className="text-sm text-zinc-300">{subtext}</span>}
          {skin?.rarity && <span className="text-sm text-zinc-300">{skin.rarity}</span>}
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
