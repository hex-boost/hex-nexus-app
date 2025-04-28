import logoHexBoost from '@/assets/logo-hex-boost.svg';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils.ts';
import { XIcon } from 'lucide-react';

type GameOverlaySkeletonProps = {
  setShowOverlay: (show: boolean) => void;
  opacity?: number;
  scale?: number;
};

export function GameOverlaySkeleton({
  setShowOverlay,
  opacity = 100,
  scale = 100,
}: GameOverlaySkeletonProps) {
  return (
    <div
      className="fixed z-50 flex flex-col items-end"
      style={{
        opacity: opacity / 100,
        transform: `scale(${scale / 100})`,
        transformOrigin: 'top right',
      }}
    >
      <div
        className={cn(
          'bg-black/80 backdrop-blur-sm border border-blue-500/50 rounded-lg shadow-lg shadow-blue-500/20 overflow-hidden transition-all duration-300',
        )}
      >
        {/* Header with Logo */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-900/80 to-blue-600/80 px-3 py-2">
          <div className="flex items-center gap-2">
            <img src={logoHexBoost} alt="Logo Hex Boost" className="w-6 h-6" />
            <span className="text-sm font-bold text-white">Nexus</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'h-5 w-5 rounded-full text-white hover:bg-white/5 hover:text-white',
              )}
              onClick={() => setShowOverlay(false)}
            >
              <XIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-3">
          {/* User Info skeleton */}
          <div className="flex justify-between items-center">
            <div className="text-xs text-zinc-400">
              <div className="h-3 w-24 bg-zinc-700/50 animate-pulse rounded" />
            </div>
            <div className="flex items-center gap-1 text-xs">
              <div className="h-3 w-12 bg-zinc-700/50 animate-pulse rounded" />
            </div>
          </div>

          {/* Rental Time skeleton */}
          <div className="flex items-center gap-3 bg-blue-950/50 p-2 rounded-md relative">
            <div className="w-10 h-10 rounded-full bg-blue-900/50 animate-pulse" />
            <div className="flex-1">
              <div className="h-4 w-20 bg-zinc-700/50 animate-pulse rounded mb-1" />
              <div className="h-3 w-24 bg-zinc-700/50 animate-pulse rounded" />
            </div>
          </div>

          {/* Quick-Extend Options skeleton */}
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-zinc-700/50 animate-pulse rounded" />
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((_, i) => (
                <div key={i} className="h-8 bg-zinc-700/50 animate-pulse rounded" />
              ))}
            </div>
          </div>

          {/* Account ID skeleton */}
          <div className="flex justify-between items-center">
            <div className="h-3 w-16 bg-zinc-700/50 animate-pulse rounded" />
            <div className="h-5 w-16 bg-zinc-700/50 animate-pulse rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
