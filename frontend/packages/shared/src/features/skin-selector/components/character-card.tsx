import type {FormattedChampion, FormattedSkin} from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import {ProgressiveBlur} from '@/components/ui/progressive-blur.tsx';

type CharacterCardProps = {
  champion: FormattedChampion;
  selectedSkin?: FormattedSkin;
  onClick?: () => void;
  skins: FormattedSkin[];
};

export default function CharacterCard({
  champion,
  selectedSkin,
  onClick,
  skins,
}: CharacterCardProps) {
  // Use selected skin if available, otherwise use default champion image
  const displaySkin = selectedSkin?.imageUrl || (champion.skins[0]?.imageUrl);

  return (
    <button
      className="relative aspect-square w-full overflow-hidden rounded-[4px]"
      onClick={onClick}
    >
      <img
        src={displaySkin}
        alt={champion.name}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
      />
      <ProgressiveBlur
        className="pointer-events-none absolute bottom-0 left-0 h-[40%] w-full"
        blurIntensity={1}
      />
      <div className="absolute bottom-0 left-0 w-full">
        <div className="flex flex-col items-start gap-0 px-5 py-4">
          <p className="text-base font-medium text-white">{champion.name}</p>
          {selectedSkin && <span className="text-sm text-zinc-300">{selectedSkin.name}</span>}
        </div>
      </div>
    </button>
  );
}
