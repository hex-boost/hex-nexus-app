import { SettingsPanel } from '@/components/GameOverlaySettings.tsx';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Clock, Info, Settings, Trophy, X } from 'lucide-react';
import { useEffect, useState } from 'react';

type GameOverlayProps = {
  accountId: string;
  elo: string;
  rank: string;
  lp: number;
  rentalTimeRemaining: number; // in seconds
  userName?: string;
};

export function GameOverlay({ accountId, elo, rank, lp, rentalTimeRemaining, userName }: GameOverlayProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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
    <TooltipProvider>
      <div
        className="fixed top-4 right-4 z-50 flex flex-col items-end"
        style={{
          opacity: opacity / 100,
          transform: `scale(${scale / 100})`,
          transformOrigin: 'top right',
        }}
      >
        <div
          className={cn(
            'bg-black/80 backdrop-blur-sm border border-blue-500/50 rounded-lg shadow-lg shadow-blue-500/20 overflow-hidden transition-all duration-300',
            isMinimized ? 'w-auto' : isSettingsOpen ? 'w-[200px]' : 'w-64',
          )}
        >
          {/* Header with Logo */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-900/80 to-blue-600/80 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-bold text-xs">
                LoL
              </div>
              {!isMinimized && <span className="text-sm font-bold text-white">LoLAccounts</span>}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-white hover:bg-blue-700/50 hover:text-white"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  'h-5 w-5 text-white hover:bg-blue-700/50 hover:text-white',
                  isSettingsOpen && 'bg-blue-700/50',
                )}
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              >
                {isSettingsOpen ? <X className="h-3 w-3" /> : <Settings className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && !isSettingsOpen && (
            <div className="p-3 space-y-3">
              {/* User Info */}
              {userName && (
                <div className="text-xs text-zinc-400">
                  Welcome,
                  {' '}
                  <span className="text-white font-medium">{userName}</span>
                </div>
              )}

              {/* Rank Info */}
              <div className="flex items-center gap-3 bg-blue-950/50 p-2 rounded-md">
                <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={cn('text-sm font-bold', getRankColor(elo))}>
                      {elo}
                      {' '}
                      {rank}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-zinc-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-xs">Your current rank in Solo Queue</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {lp}
                    {' '}
                    LP
                  </div>
                </div>
              </div>

              {/* Rental Time */}
              <div className="flex items-center gap-3 bg-blue-950/50 p-2 rounded-md">
                <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white">Rental Time</span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 text-zinc-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p className="text-xs">Time remaining on your account rental</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="text-xs text-zinc-400">
                    {timeRemaining.hours}
                    h
                    {timeRemaining.minutes}
                    m
                    {timeRemaining.seconds}
                    s
                  </div>
                </div>
              </div>

              {/* Account ID */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-zinc-500">Account ID:</span>
                <Badge variant="outline" className="text-xs bg-blue-950/50 text-blue-300 border-blue-800">
                  {accountId}
                </Badge>
              </div>
            </div>
          )}

          {/* Settings Panel - Integrated */}
          {!isMinimized && isSettingsOpen && (
            <SettingsPanel opacity={opacity} setOpacity={setOpacity} scale={scale} setScale={setScale} />
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}
