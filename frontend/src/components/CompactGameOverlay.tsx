'use client';

import { SettingsPanel } from '@/components/GameOverlaySettings.tsx';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowUp, Clock, Settings, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type CompactOverlayProps = {
  accountId: string;
  elo: string;
  rank: string;
  lp: number;
  rentalTimeRemaining: number; // in seconds
};

export function CompactOverlay({ accountId, elo, rank, lp, rentalTimeRemaining }: CompactOverlayProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  // const [isMinimized, setIsMinimized] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [opacity, setOpacity] = useState(85);
  const [scale, setScale] = useState(100);

  // Format time remaining
  useEffect(() => {
    const updateTimer = () => {
      if (rentalTimeRemaining <= 0) {
        setTimeRemaining({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(rentalTimeRemaining / 3600);
      const minutes = Math.floor((rentalTimeRemaining % 3600) / 60);
      const seconds = Math.floor(rentalTimeRemaining % 60);

      setTimeRemaining({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [rentalTimeRemaining]);

  // Get rank color
  const getRankColor = (rank: string) => {
    switch (rank.toLowerCase()) {
      case 'iron':
        return 'text-zinc-500';
      case 'bronze':
        return 'text-amber-700';
      case 'silver':
        return 'text-zinc-400';
      case 'gold':
        return 'text-amber-500';
      case 'platinum':
        return 'text-cyan-500';
      case 'diamond':
        return 'text-blue-500';
      case 'master':
        return 'text-purple-500';
      case 'grandmaster':
        return 'text-red-500';
      case 'challenger':
        return 'text-yellow-500';
      default:
        return 'text-zinc-400';
    }
  };

  return (
    <div
      className="fixed top-4 left-4 z-50"
      style={{
        opacity: opacity / 100,
        transform: `scale(${scale / 100})`,
        transformOrigin: 'top left',
      }}
    >
      <div
        className={cn(
          'bg-black/90 backdrop-blur-sm border border-blue-500/20 rounded-lg shadow-lg shadow-blue-500/10 overflow-hidden transition-all duration-300',
          isSettingsOpen ? 'w-[200px]' : 'w-[120px]',
        )}
      >
        {/* Header with Logo */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-900/90 to-blue-800/90 px-2 py-1">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-[10px]">
              LoL
            </div>
            <span className="text-xs font-bold text-white">Accounts</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-4 w-4 text-white hover:bg-blue-700/50 hover:text-white',
                isSettingsOpen && 'bg-blue-700/50',
              )}
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
              {isSettingsOpen ? <X className="h-2.5 w-2.5" /> : <Settings className="h-2.5 w-2.5" />}
            </Button>
          </div>
        </div>

        {/* Content */}
        {!isSettingsOpen && (
          <div className="p-2 space-y-1.5">
            {/* Rank Info - Compact */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white font-medium">ELO</span>
              <div className="flex items-center gap-1">
                <span className={cn('text-xs font-bold', getRankColor(elo))}>
                  {elo}
                  {' '}
                  {rank}
                </span>
              </div>
            </div>

            {/* LP - Compact */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white font-medium">LP</span>
              <div className="flex items-center gap-1">
                <span className="text-xs text-cyan-400 font-bold">{lp}</span>
                <ArrowUp className="h-3 w-3 text-green-500" />
              </div>
            </div>

            {/* Rental Time - Compact */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white font-medium">Time</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-blue-400" />
                <span className="text-xs text-blue-400">
                  {timeRemaining.hours}
                  :
                  {timeRemaining.minutes.toString().padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Account ID - Compact */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white font-medium">ID</span>
              <span className="text-xs text-zinc-400">{accountId}</span>
            </div>
          </div>
        )}

        {/* Settings Panel - Integrated */}
        {isSettingsOpen && (
          <SettingsPanel opacity={opacity} setOpacity={setOpacity} scale={scale} setScale={setScale} />
        )}
      </div>
    </div>
  );
}
