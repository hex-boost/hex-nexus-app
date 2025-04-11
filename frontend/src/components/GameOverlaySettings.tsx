'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, Eye, Monitor, Move, Palette } from 'lucide-react';
import { useState } from 'react';

type SettingsPanelProps = {
  opacity: number;
  setOpacity: (value: number) => void;
  scale: number;
  setScale: (value: number) => void;
};

export function SettingsPanel({ opacity, setOpacity, scale, setScale }: SettingsPanelProps) {
  const [showNotifications, setShowNotifications] = useState(true);
  const [position, setPosition] = useState('top-right');
  const [theme, setTheme] = useState('blue');

  return (
    <div className="p-3 h-[350px] overflow-y-auto">
      <Tabs defaultValue="appearance" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-7">
          <TabsTrigger value="appearance" className="text-[10px]">
            <Eye className="h-3 w-3 mr-1" />
            Look
          </TabsTrigger>
          <TabsTrigger value="position" className="text-[10px]">
            <Move className="h-3 w-3 mr-1" />
            Position
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-[10px]">
            <Bell className="h-3 w-3 mr-1" />
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-3 mt-3">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="opacity" className="text-xs text-zinc-400">
                Opacity
              </Label>
              <span className="text-xs text-zinc-400">
                {opacity}
                %
              </span>
            </div>
            <Slider
              id="opacity"
              min={30}
              max={100}
              step={5}
              value={[opacity]}
              onValueChange={value => setOpacity(value[0])}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="scale" className="text-xs text-zinc-400">
                Scale
              </Label>
              <span className="text-xs text-zinc-400">
                {scale}
                %
              </span>
            </div>
            <Slider
              id="scale"
              min={70}
              max={130}
              step={5}
              value={[scale]}
              onValueChange={value => setScale(value[0])}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="theme" className="text-xs text-zinc-400">
              Theme
            </Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger id="theme" className="h-7 text-xs">
                <Palette className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="blue">Blue</SelectItem>
                <SelectItem value="purple">Purple</SelectItem>
                <SelectItem value="green">Green</SelectItem>
                <SelectItem value="red">Red</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        {/* Position Tab */}
        <TabsContent value="position" className="space-y-3 mt-3">
          <div className="space-y-1.5">
            <Label htmlFor="position" className="text-xs text-zinc-400">
              Screen Position
            </Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger id="position" className="h-7 text-xs">
                <Move className="h-3 w-3 mr-1" />
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top-right">Top Right</SelectItem>
                <SelectItem value="top-left">Top Left</SelectItem>
                <SelectItem value="bottom-right">Bottom Right</SelectItem>
                <SelectItem value="bottom-left">Bottom Left</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-950/30 rounded-md p-2 mt-2">
            <div className="text-xs text-zinc-400 mb-1">Preview</div>
            <div className="relative w-full h-24 bg-zinc-900/50 rounded border border-zinc-800 overflow-hidden">
              <div
                className={`absolute ${position === 'top-right' ? 'top-1 right-1' : ''} ${
                  position === 'top-left' ? 'top-1 left-1' : ''
                } ${position === 'bottom-right' ? 'bottom-1 right-1' : ''} ${
                  position === 'bottom-left' ? 'bottom-1 left-1' : ''
                } w-10 h-5 bg-blue-600/80 rounded-sm`}
              >
              </div>
              <Monitor className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-zinc-700 h-10 w-10" />
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-3 mt-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="notifications" className="text-xs text-zinc-400">
              Show Notifications
            </Label>
            <Switch id="notifications" checked={showNotifications} onCheckedChange={setShowNotifications} />
          </div>

          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <Switch id="notify-expiry" defaultChecked disabled={!showNotifications} />
              <Label htmlFor="notify-expiry" className="text-xs text-zinc-400">
                Rental expiry warnings
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="notify-game" defaultChecked disabled={!showNotifications} />
              <Label htmlFor="notify-game" className="text-xs text-zinc-400">
                Game start/end
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="notify-rank" defaultChecked disabled={!showNotifications} />
              <Label htmlFor="notify-rank" className="text-xs text-zinc-400">
                Rank changes
              </Label>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-4 pt-2 border-t border-zinc-800">
        <Button size="sm" variant="outline" className="w-full text-xs">
          Save Changes
        </Button>
      </div>
    </div>
  );
}
