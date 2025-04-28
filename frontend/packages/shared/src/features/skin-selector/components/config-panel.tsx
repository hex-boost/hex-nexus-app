import type { LayoutConfig } from '@/components/character-selection';
import Breadcrumb from '@/components/breadcrumb';
import { Button } from '@/components/ui/button.tsx';
import { Label } from '@/components/ui/label.tsx';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.tsx';
import { Slider } from '@/components/ui/slider.tsx';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Trash2 } from 'lucide-react';

type ConfigPanelProps = {
  config: LayoutConfig;
  onUpdateConfig: (config: LayoutConfig) => void;
  onBack: () => void;
};

export default function ConfigPanel({ config, onUpdateConfig, onBack }: ConfigPanelProps) {
  const { toast } = useToast();

  // Calculate current cache usage (mock data)
  const currentCacheUsage = 342; // MB

  // Handle cache clear
  const handleClearCache = () => {
    // In a real app, this would clear the actual cache
    toast({
      title: 'Cache cleared',
      description: 'Application cache has been cleared successfully.',
      duration: 2000,
    });
  };

  // Get breadcrumb items
  const breadcrumbItems = [
    { label: 'Home', onClick: onBack },
    { label: 'Configuration', onClick: () => {} },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <Breadcrumb items={breadcrumbItems} />

        <div className="flex items-center justify-between mt-2">
          <h1 className="text-xl font-bold">Configuration</h1>

          <Button variant="outline" size="sm" onClick={onBack}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {' '}
            Back
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Layout section */}
          <section>
            <h2 className="text-lg font-medium mb-4">Layout Settings</h2>
            <div className="space-y-6 bg-shade9 p-4 rounded-lg border border-border">
              <div className="space-y-2">
                <Label>Grid Size</Label>
                <RadioGroup
                  value={config.gridSize}
                  onValueChange={value =>
                    onUpdateConfig({ ...config, gridSize: value as 'small' | 'medium' | 'large' })}
                  className="flex space-x-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="small" id="small" />
                    <Label htmlFor="small">Small</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medium" id="medium" />
                    <Label htmlFor="medium">Medium</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="large" id="large" />
                    <Label htmlFor="large">Large</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Layout Type</Label>
                <RadioGroup
                  value={config.layout}
                  onValueChange={value => onUpdateConfig({ ...config, layout: value as 'grid' | 'list' | 'compact' })}
                  className="flex space-x-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="grid" id="grid" />
                    <Label htmlFor="grid">Grid</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="compact" id="compact" />
                    <Label htmlFor="compact">Compact</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="list" id="list" />
                    <Label htmlFor="list">List</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </section>

          {/* Animation section */}
          <section>
            <h2 className="text-lg font-medium mb-4">Animation Settings</h2>
            <div className="space-y-6 bg-shade9 p-4 rounded-lg border border-border">
              <div className="space-y-2">
                <Label>Animation Speed</Label>
                <RadioGroup
                  value={config.animationSpeed}
                  onValueChange={value =>
                    onUpdateConfig({ ...config, animationSpeed: value as 'none' | 'fast' | 'normal' })}
                  className="flex space-x-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none">None</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fast" id="fast" />
                    <Label htmlFor="fast">Fast</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="normal" id="normal" />
                    <Label htmlFor="normal">Normal</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </section>

          {/* Cache section */}
          <section>
            <h2 className="text-lg font-medium mb-4">Cache Settings</h2>
            <div className="space-y-6 bg-shade9 p-4 rounded-lg border border-border">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Cache Limit</Label>
                  <span className="text-sm text-muted-foreground">
                    {config.cacheLimit}
                    {' '}
                    MB
                  </span>
                </div>
                <Slider
                  value={[config.cacheLimit]}
                  min={100}
                  max={1000}
                  step={100}
                  onValueChange={value => onUpdateConfig({ ...config, cacheLimit: value[0] })}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Current Cache Usage</Label>
                  <span className="text-sm text-muted-foreground">
                    {currentCacheUsage}
                    {' '}
                    MB /
                    {config.cacheLimit}
                    {' '}
                    MB
                  </span>
                </div>
                <div className="w-full h-2 bg-shade7 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(currentCacheUsage / config.cacheLimit) * 100}%` }}
                  />
                </div>
              </div>

              <Button variant="destructive" size="sm" className="w-full" onClick={handleClearCache}>
                <Trash2 className="h-4 w-4 mr-2" />
                {' '}
                Clear Cache
              </Button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
