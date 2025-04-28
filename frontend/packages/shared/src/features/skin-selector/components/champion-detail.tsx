import type { Champion, Chroma, Skin, SkinTag } from '@/components/character-selection';
import Breadcrumb from '@/components/breadcrumb';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { cn } from '@/lib/utils.ts';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CuboidIcon as Cube, Play, Plus, TagIcon, X } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

type ChampionDetailProps = {
  champion: Champion;
  onBack: () => void;
  userPreferences?: {
    selectedSkinId: number;
    selectedChromaId?: number;
  };
  onSaveSkin: (championId: number, skinId: number, chromaId?: number) => void;
  onAddToComparison: (champion: Champion, skin: Skin) => void;
  animationDuration?: number;
  skinTags: SkinTag[];
  getTagsForSkin: (skinId: number) => SkinTag[];
  onAddTag: (skinId: number, tagId: string) => void;
  onRemoveTag: (skinId: number, tagId: string) => void;
};

type MediaType = 'image' | 'video' | '3d';

export default function ChampionDetail({
  champion,
  onBack,
  userPreferences,
  onSaveSkin,
  onAddToComparison,
  animationDuration = 0.3,
  skinTags,
  getTagsForSkin,
  onAddTag,
  onRemoveTag,
}: ChampionDetailProps) {
  // Get the initially selected skin based on user preferences
  const initialSkinId = userPreferences?.selectedSkinId || champion.skins[0].id;
  const initialSkin = champion.skins.find(skin => skin.id === initialSkinId) || champion.skins[0];

  // State for selected skin and chroma
  const [selectedSkin, setSelectedSkin] = useState<Skin>(initialSkin);
  const [selectedChroma, setSelectedChroma] = useState<Chroma | null>(
    userPreferences?.selectedChromaId && selectedSkin.chromas
      ? selectedSkin.chromas.find(c => c.id === userPreferences.selectedChromaId) || null
      : null,
  );
  const [mediaType, setMediaType] = useState<MediaType>('image');

  // Handle skin selection
  const handleSkinSelect = (skin: Skin) => {
    setSelectedSkin(skin);
    setSelectedChroma(null); // Reset chroma when changing skin
    setMediaType('image'); // Reset media type when changing skin
  };

  // Handle chroma selection
  const handleChromaSelect = (chroma: Chroma | null) => {
    setSelectedChroma(chroma);
  };

  // Save current selection
  const handleSave = () => {
    onSaveSkin(champion.id, selectedSkin.id, selectedChroma?.id);
  };

  // Get breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', onClick: onBack },
    { label: champion.name, onClick: () => {} },
  ];

  // Get current media source based on type
  const getCurrentMedia = () => {
    if (mediaType === 'video' && selectedSkin.webm) {
      return <video src={selectedSkin.webm} className="object-contain h-full w-full" controls autoPlay loop />;
    } else if (mediaType === '3d' && selectedSkin.model3d) {
      return (
        <div className="flex items-center justify-center h-full w-full">
          <div className="text-center">
            <Cube className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">3D Model Viewer</p>
            <p className="text-xs text-muted-foreground mt-2">
              (3D model would render here in a production environment)
            </p>
          </div>
        </div>
      );
    } else {
      // Default to image
      return (
        <Image
          src={selectedChroma?.image || selectedSkin.image}
          alt={`${champion.name} - ${selectedSkin.name} ${selectedChroma ? selectedChroma.name : ''}`}
          className="object-contain"
          fill
          sizes="(max-width: 768px) 100vw, 600px"
        />
      );
    }
  };

  // Get tags for current skin
  const currentSkinTags = getTagsForSkin(selectedSkin.id);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Breadcrumb items={breadcrumbItems} />

        <div className="flex items-center justify-between mt-2">
          <h1 className="text-xl font-bold">{champion.name}</h1>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onAddToComparison(champion, selectedSkin)}>
              <Plus className="h-4 w-4 mr-1" />
              {' '}
              Add to Comparison
            </Button>
            <Button size="sm" onClick={handleSave}>
              Save Selection
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Preview area */}
        <div className="w-full md:w-2/3 h-full relative bg-shade10 flex flex-col">
          {/* Media type selector */}
          {(selectedSkin.webm || selectedSkin.model3d) && (
            <div className="flex items-center gap-2 p-2 border-b border-border">
              <Button
                variant={mediaType === 'image' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setMediaType('image')}
              >
                Image
              </Button>
              {selectedSkin.webm && (
                <Button
                  variant={mediaType === 'video' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setMediaType('video')}
                >
                  <Play className="h-3 w-3 mr-1" />
                  {' '}
                  Video
                </Button>
              )}
              {selectedSkin.model3d && (
                <Button
                  variant={mediaType === '3d' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setMediaType('3d')}
                >
                  <Cube className="h-3 w-3 mr-1" />
                  {' '}
                  3D Model
                </Button>
              )}
            </div>
          )}

          {/* Media preview */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedSkin.id}-${selectedChroma?.id || 'default'}-${mediaType}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: animationDuration }}
                className="relative h-[70vh] max-h-[600px] w-full max-w-[400px]"
              >
                {getCurrentMedia()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Current selection info */}
          <div className="p-3 bg-shade9 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{selectedSkin.name}</h3>
                {selectedChroma && (
                  <p className="text-sm text-muted-foreground">
                    {selectedChroma.name}
                    {' '}
                    Chroma
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{selectedSkin.rarity}</div>
                <div className="text-xs text-muted-foreground">{selectedSkin.skinLine}</div>
              </div>
            </div>

            {/* Tags */}
            {currentSkinTags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {currentSkinTags.map(tag => (
                  <Badge
                    key={tag.id}
                    style={{ backgroundColor: `${tag.color}40`, color: tag.color }}
                    className="flex items-center gap-1 cursor-pointer hover:opacity-80"
                    onClick={() => onRemoveTag(selectedSkin.id, tag.id)}
                  >
                    {tag.name}
                    <X className="h-3 w-3" />
                  </Badge>
                ))}
              </div>
            )}

            {/* Add tag dropdown */}
            <div className="mt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    <TagIcon className="h-3 w-3 mr-1" />
                    {' '}
                    Add Tag
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {skinTags
                    .filter(tag => !currentSkinTags.some(t => t.id === tag.id))
                    .map(tag => (
                      <DropdownMenuItem
                        key={tag.id}
                        onClick={() => onAddTag(selectedSkin.id, tag.id)}
                        className="flex items-center gap-2"
                      >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
                        {tag.name}
                      </DropdownMenuItem>
                    ))}
                  {skinTags.filter(tag => !currentSkinTags.some(t => t.id === tag.id)).length === 0 && (
                    <DropdownMenuItem disabled>No more tags available</DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Abilities preview */}
          {selectedSkin.abilities && (
            <div className="p-3 border-t border-border">
              <h3 className="font-medium text-sm mb-2">Abilities</h3>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {selectedSkin.abilities.map((ability, index) => (
                  <div key={index} className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden relative group">
                    <Image
                      src={ability.image || '/placeholder.svg'}
                      alt={ability.name}
                      className="object-cover"
                      fill
                      sizes="64px"
                    />
                    <div className="absolute inset-0 bg-shade10/80 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-xs text-center px-1">{ability.name}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Selection area */}
        <div className="w-full md:w-1/3 h-full border-l border-border overflow-y-auto">
          <Tabs defaultValue="skins" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="skins">Skins</TabsTrigger>
              <TabsTrigger value="chromas" disabled={!selectedSkin.chromas?.length}>
                Chromas
              </TabsTrigger>
            </TabsList>

            {/* Skins tab */}
            <TabsContent value="skins" className="p-0">
              <div className="grid grid-cols-1 gap-2 p-4">
                {champion.skins.map(skin => (
                  <SkinOption
                    key={skin.id}
                    skin={skin}
                    isSelected={selectedSkin.id === skin.id}
                    onClick={() => handleSkinSelect(skin)}
                    hasChromas={!!skin.chromas?.length}
                    animationDuration={animationDuration}
                    tags={getTagsForSkin(skin.id)}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Chromas tab */}
            <TabsContent value="chromas" className="p-0">
              <div className="p-4">
                <div className="mb-4">
                  <SkinOption
                    skin={selectedSkin}
                    isSelected={!selectedChroma}
                    onClick={() => handleChromaSelect(null)}
                    label="Default"
                    animationDuration={animationDuration}
                    tags={getTagsForSkin(selectedSkin.id)}
                  />
                </div>

                <h3 className="font-medium mb-2 text-sm text-muted-foreground">Chromas</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedSkin.chromas?.map(chroma => (
                    <ChromaOption
                      key={chroma.id}
                      chroma={chroma}
                      isSelected={selectedChroma?.id === chroma.id}
                      onClick={() => handleChromaSelect(chroma)}
                      animationDuration={animationDuration}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Skin option component
type SkinOptionProps = {
  skin: Skin;
  isSelected: boolean;
  onClick: () => void;
  hasChromas?: boolean;
  label?: string;
  animationDuration?: number;
  tags?: SkinTag[];
};

function SkinOption({
  skin,
  isSelected,
  onClick,
  hasChromas,
  label,
  animationDuration = 0.3,
  tags = [],
}: SkinOptionProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: animationDuration }}
      className={cn(
        'flex items-center p-2 rounded-lg cursor-pointer transition-colors',
        isSelected ? 'bg-primary/20 border border-primary' : 'bg-shade8 hover:bg-shade7 border border-transparent',
      )}
      onClick={onClick}
    >
      <div className="w-16 h-16 rounded-md overflow-hidden mr-3 flex-shrink-0 relative">
        <Image src={skin.image || '/placeholder.svg'} alt={skin.name} className="object-cover" fill sizes="64px" />
      </div>

      <div className="flex-1">
        <h3 className="font-medium">{label || skin.name}</h3>
        {skin.rarity && <p className="text-xs text-muted-foreground">{skin.rarity}</p>}
        {hasChromas && <p className="text-xs text-primary/80">Has chromas</p>}

        {/* Display tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {tags.map(tag => (
              <div
                key={tag.id}
                className="px-1.5 py-0.5 rounded-sm text-[10px]"
                style={{ backgroundColor: `${tag.color}40`, color: tag.color }}
              >
                {tag.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {isSelected && (
        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </motion.div>
  );
}

// Chroma option component
type ChromaOptionProps = {
  chroma: Chroma;
  isSelected: boolean;
  onClick: () => void;
  animationDuration?: number;
};

function ChromaOption({ chroma, isSelected, onClick, animationDuration = 0.3 }: ChromaOptionProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: animationDuration }}
      className={cn(
        'flex flex-col items-center p-2 rounded-lg cursor-pointer transition-colors relative',
        isSelected ? 'bg-primary/20 border border-primary' : 'bg-shade8 hover:bg-shade7 border border-transparent',
      )}
      onClick={onClick}
    >
      <div className="w-full aspect-square rounded-md overflow-hidden mb-2 relative">
        <Image src={chroma.image || '/placeholder.svg'} alt={chroma.name} className="object-cover" fill sizes="100px" />
      </div>

      <span className="text-xs font-medium">{chroma.name}</span>

      {isSelected && (
        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
          <Check className="h-3 w-3 text-primary-foreground" />
        </div>
      )}
    </motion.div>
  );
}
