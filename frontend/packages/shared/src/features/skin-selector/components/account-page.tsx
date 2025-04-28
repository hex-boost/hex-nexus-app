import type { Champion, Chroma, Skin } from '@/features/skin-selector/components/character-selection';
import { Button } from '@/components/ui/button.tsx';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Edit2 } from 'lucide-react';
import { useState } from 'react';

// Mock account data
const accountData = {
  username: 'vdzzi6gffy',
  tag: 'chiapetonspeeddichia',
  coins: 48903,
  refundableCoins: 132,
  champions: 25,
  skins: 4,
  server: 'NA',
  blueEssence: 123,
  riotPoints: 40,
  status: {
    soloQueue: { rank: 'Unranked', lp: 0 },
    flexQueue: { rank: 'Unranked NA', lp: 0 },
  },
  isRented: true,
  isExpired: true,
  isVerified: true,
};

export default function AccountPage() {
  const [isSkinSelectorOpen, setIsSkinSelectorOpen] = useState(false);
  const [selectedSkins, setSelectedSkins] = useState<{
    champion: Champion;
    skin: Skin;
    chroma?: Chroma | null;
  }[]>([]);
  const [currentSkinIndex, setCurrentSkinIndex] = useState(0);

  // Handle skin selection
  const handleSkinSelect = (champion: Champion, skin: Skin, chroma?: Chroma | null) => {
    // Check if we already have a skin for this champion
    const existingIndex = selectedSkins.findIndex(item => item.champion.id === champion.id);

    if (existingIndex >= 0) {
      // Update existing skin
      setSelectedSkins((prev) => {
        const updated = [...prev];
        updated[existingIndex] = { champion, skin, chroma };
        return updated;
      });
    } else {
      // Add new skin
      setSelectedSkins(prev => [...prev, { champion, skin, chroma }]);
    }
  };

  // Navigate through selected skins
  const handlePrevSkin = () => {
    setCurrentSkinIndex(prev => (prev > 0 ? prev - 1 : selectedSkins.length - 1));
  };

  const handleNextSkin = () => {
    setCurrentSkinIndex(prev => (prev < selectedSkins.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="p-4 border-b border-border flex items-center">
        <Button variant="ghost" size="sm" className="mr-2">
          <ArrowLeft className="h-4 w-4 mr-1" />
          {' '}
          Back to Accounts
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 text-primary">
            <span className="font-medium">{accountData.coins}</span>
            <span>coins</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="col-span-2">
          {/* Account info */}
          <div className="bg-card rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="bg-shade8 rounded-lg p-3 mr-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img
                    src="/placeholder.svg?height=64&width=64"
                    alt="Account avatar"
                    width={64}
                    height={64}
                  />
                </div>
              </div>
              <div>
                <h1 className="text-xl font-bold">{accountData.username}</h1>
                <p className="text-muted-foreground text-sm">{accountData.tag}</p>
              </div>
              <div className="ml-auto">
                <Button variant="ghost" size="sm">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Rank info */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-card rounded-lg p-4 flex flex-col items-center">
              <div className="bg-shade8 rounded-full w-24 h-24 mb-2 flex items-center justify-center">
                <img
                  src="/placeholder.svg?height=80&width=80"
                  alt="Solo Queue Rank"
                  width={80}
                  height={80}
                />
              </div>
              <h3 className="font-medium">Unranked</h3>
              <p className="text-sm text-muted-foreground">Solo Queue</p>
            </div>
            <div className="bg-card rounded-lg p-4 flex flex-col items-center">
              <div className="bg-shade8 rounded-full w-24 h-24 mb-2 flex items-center justify-center">
                <img
                  src="/placeholder.svg?height=80&width=80"
                  alt="Flex Queue Rank"
                  width={80}
                  height={80}
                />
              </div>
              <h3 className="font-medium">Unranked NA</h3>
              <p className="text-sm text-muted-foreground">Flex Queue</p>
            </div>
          </div>

          {/* Skins section */}
          <div className="bg-card rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium">
                Skins (
                {selectedSkins.length}
                )
              </h2>
              <Button onClick={() => setIsSkinSelectorOpen(true)}>
                Select Skins
              </Button>
            </div>

            {selectedSkins.length > 0
              ? (
                  <div className="relative">
                    {/* Skin navigation */}
                    {selectedSkins.length > 1 && (
                      <>
                        <button
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-shade10/80 rounded-full p-2"
                          onClick={handlePrevSkin}
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-shade10/80 rounded-full p-2"
                          onClick={handleNextSkin}
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    {/* Skin display */}
                    <motion.div
                      key={`${selectedSkins[currentSkinIndex].champion.id}-${selectedSkins[currentSkinIndex].skin.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-shade9 rounded-lg overflow-hidden"
                    >
                      <div className="relative h-[300px]">
                        <img
                          src={selectedSkins[currentSkinIndex].chroma?.image || selectedSkins[currentSkinIndex].skin.image}
                          alt={`${selectedSkins[currentSkinIndex].champion.name} - ${selectedSkins[currentSkinIndex].skin.name}`}
                          className="object-contain"
                          sizes="(max-width: 768px) 100vw, 600px"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-lg">
                          {selectedSkins[currentSkinIndex].champion.name}
                          {' '}
                          -
                          {selectedSkins[currentSkinIndex].skin.name}
                        </h3>
                        {selectedSkins[currentSkinIndex].chroma && (
                          <p className="text-sm text-muted-foreground">
                            {selectedSkins[currentSkinIndex].chroma.name}
                            {' '}
                            Chroma
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="text-sm text-muted-foreground">
                            {selectedSkins[currentSkinIndex].skin.rarity}
                            {' '}
                            •
                            {selectedSkins[currentSkinIndex].skin.skinLine}
                          </div>
                          <div className="text-sm">
                            {currentSkinIndex + 1}
                            {' '}
                            of
                            {selectedSkins.length}
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Skin thumbnails */}
                    {selectedSkins.length > 1 && (
                      <div className="flex justify-center mt-4 gap-2">
                        {selectedSkins.map((item, index) => (
                          <button
                            key={`thumb-${item.champion.id}-${item.skin.id}`}
                            className={`w-3 h-3 rounded-full ${
                              index === currentSkinIndex ? 'bg-primary' : 'bg-shade7'
                            }`}
                            onClick={() => setCurrentSkinIndex(index)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-shade9 rounded-lg p-6 text-center">
                    <p className="text-muted-foreground mb-4">No skins selected yet</p>
                    <Button onClick={() => setIsSkinSelectorOpen(true)}>
                      Select Skins
                    </Button>
                  </div>
                )}
          </div>

        </div>
      </div>
    </div>
  );
}
