import { CompactOverlay } from '@/components/CompactGameOverlay.tsx';
import { GameOverlay } from '@/components/GameOverlay.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.tsx';
import { useState } from 'react';

export function GameOverlayPage() {
  const [showOverlay, setShowOverlay] = useState(true);
  const [overlayStyle, setOverlayStyle] = useState<'standard' | 'compact'>('standard');

  // Sample data
  const accountData = {
    accountId: 'D7X92C',
    elo: 'Diamond',
    rank: 'II',
    lp: 75,
    rentalTimeRemaining: 14400, // 4 hours in seconds
    userName: 'HiddenSniper92',
  };
  return (
    <>
      <div className="min-h-screen bg-[url('/placeholder.svg?height=1080&width=1920&text=League+of+Legends+Game')] bg-cover bg-center">
        {/* Game simulation background */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

        {/* Game UI simulation */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-[800px] h-[120px] bg-black/60 border border-zinc-700 rounded-md"></div>
        <div className="absolute top-4 left-4 w-[200px] h-[100px] bg-black/60 border border-zinc-700 rounded-md"></div>
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-[400px] h-[60px] bg-black/60 border border-zinc-700 rounded-md"></div>

        {/* Toggle buttons for demo purposes */}
        <div className="absolute bottom-4 left-4 z-50 space-y-2">
          <Button onClick={() => setShowOverlay(!showOverlay)} variant={showOverlay ? 'destructive' : 'default'}>
            {showOverlay ? 'Hide Overlay' : 'Show Overlay'}
          </Button>

          <Tabs value={overlayStyle} onValueChange={value => setOverlayStyle(value as 'standard' | 'compact')}>
            <TabsList>
              <TabsTrigger value="standard">Standard</TabsTrigger>
              <TabsTrigger value="compact">Compact</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* The actual overlay */}
        {showOverlay && overlayStyle === 'standard' && <GameOverlay {...accountData} />}
        {showOverlay && overlayStyle === 'compact' && <CompactOverlay {...accountData} />}
      </div>
    </>
  );
}
