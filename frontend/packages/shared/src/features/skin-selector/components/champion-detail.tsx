import type {FormattedChampion, FormattedSkin} from '@/hooks/useDataDragon/types/useDataDragonHook.ts';

import {Button} from '@/components/ui/button.tsx';
import CharacterCard from '@/features/skin-selector/components/character-card.tsx';
import {useNavigate} from '@tanstack/react-router';
import {motion} from 'framer-motion';
import {ArrowLeft} from 'lucide-react';
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
  const navigate = useNavigate();

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
    onSaveSkin(Number(champion.id), Number(skin.id));
  };

  return (
    <div className="flex flex-col h-full overflow-auto bg-background">
      {/* Main content - Grid of skins */}
      <div className="p-6">
        <div className="flex gap-4 items-center mb-4">

          <Button
            className="text-muted"
            variant="outline"
            onClick={onBack}
          >
            <ArrowLeft size={16} className="mr-2 text-white" />
            Back
          </Button>
          <h2 className="text-2xl font-bold  text-foreground">{champion.name}</h2>

        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 mb-8">
          {champion.skins.map(skin => (
            <motion.div
              key={skin.id}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: animationDuration }}
            >
              <CharacterCard
                skin={skin}
                isSelected={selectedSkin.id === skin.id}
                onClick={() => handleSkinSelect(skin)}
                onBack={onBack}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
