import type { Champion, Skin } from '@/components/character-selection';
import Breadcrumb from '@/components/breadcrumb';
import { Button } from '@/components/ui/button.tsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { motion } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';

type SkinTag = {
  id: string;
  label: string;
};

type SkinComparisonProps = {
  items: { champion: Champion; skin: Skin }[];
  onRemove: (skinId: number) => void;
  onBack: () => void;
  animationDuration?: number;
  skinTags?: SkinTag[];
  getTagsForSkin?: (skinId: number) => SkinTag[];
  onAddTag?: (skinId: number, tagId: string) => void;
  onRemoveTag?: (skinId: number, tagId: string) => void;
};

export default function SkinComparison({ items, onRemove, onBack, animationDuration = 0.3 }: SkinComparisonProps) {
  // Get breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', onClick: onBack },
    { label: 'Skin Comparison', onClick: () => {} },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Breadcrumb items={breadcrumbItems} />

        <div className="flex items-center justify-between mt-2">
          <h1 className="text-xl font-bold">Skin Comparison</h1>

          <Button variant="outline" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {' '}
            Back
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        {items.length === 0
          ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-muted-foreground mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto mb-2"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M3 9h18" />
                    <path d="M9 21V9" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium">No skins to compare</h3>
                <p className="text-muted-foreground mt-1 max-w-md">
                  Add skins to comparison from champion details page to compare them side by side.
                </p>
                <Button className="mt-4" onClick={onBack}>
                  Browse Champions
                </Button>
              </div>
            )
          : (
              <div>
                <Tabs defaultValue="visual" className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="visual">Visual</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="abilities">Abilities</TabsTrigger>
                  </TabsList>

                  <TabsContent value="visual" className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {items.map(({ champion, skin }) => (
                        <motion.div
                          key={skin.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: animationDuration }}
                          className="relative"
                        >
                          <div className="absolute top-2 right-2 z-10">
                            <button
                              className="bg-shade10/80 hover:bg-shade9 rounded-full p-1 transition-colors"
                              onClick={() => onRemove(skin.id)}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="bg-shade9 rounded-lg overflow-hidden border border-border">
                            <div className="relative h-[400px]">
                              <img
                                src={skin.image || '/placeholder.svg'}
                                alt={`${champion.name} - ${skin.name}`}
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 33vw"
                              />
                            </div>

                            <div className="p-4">
                              <h3 className="font-semibold text-lg">{skin.name}</h3>
                              <p className="text-sm text-muted-foreground">{champion.name}</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="details" className="mt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 text-muted-foreground font-medium">Property</th>
                            {items.map(({ champion, skin }) => (
                              <th key={skin.id} className="text-left p-3 font-medium">
                                {champion.name}
                                {' '}
                                -
                                {skin.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-border">
                            <td className="p-3 text-muted-foreground">Rarity</td>
                            {items.map(({ skin }) => (
                              <td key={skin.id} className="p-3">
                                {skin.rarity}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-3 text-muted-foreground">Skin Line</td>
                            {items.map(({ skin }) => (
                              <td key={skin.id} className="p-3">
                                {skin.skinLine}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-3 text-muted-foreground">Release Date</td>
                            {items.map(({ skin }) => (
                              <td key={skin.id} className="p-3">
                                {skin.releaseDate}
                              </td>
                            ))}
                          </tr>
                          <tr className="border-b border-border">
                            <td className="p-3 text-muted-foreground">Has Chromas</td>
                            {items.map(({ skin }) => (
                              <td key={skin.id} className="p-3">
                                {skin.chromas && skin.chromas.length > 0 ? `Yes (${skin.chromas.length})` : 'No'}
                              </td>
                            ))}
                          </tr>
                          <tr>
                            <td className="p-3 text-muted-foreground">Media Types</td>
                            {items.map(({ skin }) => (
                              <td key={skin.id} className="p-3">
                                <div className="flex flex-wrap gap-1">
                                  <span className="px-2 py-0.5 bg-shade8 rounded-full text-xs">img</span>
                                  {skin.webm && <span className="px-2 py-0.5 bg-shade8 rounded-full text-xs">Video</span>}
                                  {skin.model3d && (
                                    <span className="px-2 py-0.5 bg-shade8 rounded-full text-xs">3D Model</span>
                                  )}
                                </div>
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="abilities" className="mt-0">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left p-3 text-muted-foreground font-medium">Ability</th>
                            {items.map(({ champion, skin }) => (
                              <th key={skin.id} className="text-left p-3 font-medium">
                                {champion.name}
                                {' '}
                                -
                                {skin.name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {['Q', 'W', 'E', 'R'].map((ability, index) => (
                            <tr key={ability} className="border-b border-border">
                              <td className="p-3 text-muted-foreground">{ability}</td>
                              {items.map(({ skin }) => (
                                <td key={skin.id} className="p-3">
                                  {skin.abilities && skin.abilities[index]
                                    ? (
                                        <div className="flex items-center gap-2">
                                          <div className="w-10 h-10 rounded overflow-hidden relative flex-shrink-0">
                                            <img
                                              src={skin.abilities[index].image || '/placeholder.svg'}
                                              alt={skin.abilities[index].name}
                                              className="object-cover"
                                              sizes="40px"
                                            />
                                          </div>
                                          <span className="text-sm">{skin.abilities[index].name}</span>
                                        </div>
                                      )
                                    : (
                                        <span className="text-muted-foreground">Not available</span>
                                      )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
      </div>
    </div>
  );
}
