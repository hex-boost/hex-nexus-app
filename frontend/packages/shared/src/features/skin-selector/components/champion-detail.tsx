import type {FormattedChampion, FormattedSkin} from '@/hooks/useDataDragon/types/useDataDragonHook.ts';
import {ProgressiveBlur} from '@/components/ui/progressive-blur.tsx';
import Breadcrumb from '@/features/skin-selector/components/breadcrumb';
import {cn} from '@/lib/utils.ts';
import {motion} from 'framer-motion';
import {Check} from 'lucide-react';
import {useState} from 'react';

type ChampionDetailProps = {
  champion: FormattedChampion;
  onBack: () => void;
  userPreferences?: {
    selectedSkinId: number;
    selectedChromaId?: number;
  };
  onSaveSkin: (championId: number, skinId: number, chromaId?: number) => void;
  animationDuration?: number;
};

export default function ChampionDetail({
  champion,
  onBack,
  userPreferences,
  onSaveSkin,
  animationDuration = 0.3,
}: ChampionDetailProps) {
  // Get the initially selected skin based on user preferences
  const initialSkinId = userPreferences?.selectedSkinId || champion.skins[0].id;
  const initialSkin = champion.skins.find(skin => skin.id === initialSkinId) || champion.skins[0];

  // State for selected skin and chroma
  const [selectedSkin, setSelectedSkin] = useState<FormattedSkin>(initialSkin);
  const [selectedChroma, setSelectedChroma] = useState<any | null>(
    userPreferences?.selectedChromaId && selectedSkin.chromas
      ? selectedSkin.chromas.find(c => c.id === userPreferences.selectedChromaId) || null
      : null,
  );

  // Handle skin selection
  const handleSkinSelect = (skin: FormattedSkin) => {
    setSelectedSkin(skin);
    setSelectedChroma(null); // Reset chroma when changing skin
    onSaveSkin(Number(champion.id), skin.id);
  };

  // Get breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', onClick: onBack },
    { label: champion.name, onClick: () => {} },
  ];

  return (
    <div className="flex flex-col h-full overflow-auto bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-shade9 p-4 border-b border-border">
        <Breadcrumb items={breadcrumbItems} />
        <div className="flex items-center justify-between mt-2">
          <h1 className="text-xl font-bold">{champion.name}</h1>
        </div>
      </div>

      {/* Main content - Grid of skins */}
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-foreground">Available Skins</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
          {champion.skins.map(skin => (
            <motion.div
              key={skin.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: animationDuration }}
            >
              <SkinCard
                skin={skin}
                isSelected={selectedSkin.id === skin.id}
                onClick={() => handleSkinSelect(skin)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skin Card Component
type SkinCardProps = {
  skin: FormattedSkin;
  isSelected: boolean;
  onClick: () => void;
};

function SkinCard({ skin, isSelected, onClick }: SkinCardProps) {
  return (
    <button
      className={cn(
        'relative aspect-square w-full overflow-hidden rounded-[4px]',
        isSelected && 'ring-2 ring-primary',
      )}
      onClick={onClick}
    >
      <img
        src={skin.imageUrl}
        alt={skin.name}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
      />
      <ProgressiveBlur
        className="pointer-events-none absolute bottom-0 left-0 h-[40%] w-full"
        blurIntensity={1}
      />
      <div className="absolute bottom-0 left-0 w-full">
        <div className="flex flex-col items-start gap-0 px-5 py-4">
          <p className="text-base font-medium text-white">{skin.name}</p>
          {skin.rarity && <span className="text-sm text-zinc-300">{skin.rarity}</span>}
        </div>
      </div>

      {isSelected && (
        <div className="absolute top-2 right-2 bg-primary rounded-full w-6 h-6 flex items-center justify-center">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}
    </button>
  );
}
