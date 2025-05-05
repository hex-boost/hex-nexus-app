import type { ExtensionOption } from '@/components/extend-rental.ts';
import logoHexBoost from '@/assets/logo-hex-boost.svg';

import { AnimatedCoinChange, AnimatedCoins, AnimatedTimeDisplay } from '@/components/AnimatedNumber.tsx';
import { CoinIcon } from '@/components/coin-icon.tsx';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.tsx';
import { Badge } from '@/components/ui/badge.tsx';
import { Button } from '@/components/ui/button.tsx';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { QuickExtendButtons } from '@/features/game-overlay/components/GameOverlayQuickExtend.tsx';
import { GameOverlaySkeleton } from '@/features/game-overlay/components/GameOverlaySkeleton.tsx';
import { useCommonFetch } from '@/hooks/useCommonFetch.ts';
import { useContextMenu } from '@/hooks/useContextMenu.ts';
import { useOverlayAccount } from '@/hooks/useOverlayAccount.ts';
import { cn } from '@/lib/utils.ts';
import { useUserStore } from '@/stores/useUserStore.ts';
import { Monitor as AccountMonitor } from '@account';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Clock, XIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

type GameOverlayProps = {
  setShowOverlay: (show: boolean) => void;
  opacity?: number;
  scale?: number;
};

export function GameOverlay({
  setShowOverlay,
  opacity = 100,
  scale = 100,
}: GameOverlayProps) {
  const { handleReload } = useContextMenu();
  const overlayRef = useRef<HTMLDivElement>(null);
  const { refetchUser } = useCommonFetch();

  useEffect(() => {
    // Add context menu event listener
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault(); // Prevent default browser context menu

      refetchUser();
      handleReload();
    };

    const element = overlayRef.current;
    element?.addEventListener('contextmenu', handleContextMenu);

    return () => {
      element?.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [handleReload]);
  const { data: username, isLoading: isUsernameLoading } = useQuery({
    queryKey: ['loggedInUsername'],
    queryFn: async () => {
      return AccountMonitor.GetLoggedInUsername('');
    },
  });
  const { user } = useUserStore();
  const {
    account,
    initialRentalTime,
    handleExtendAccount,
    isExtendPending,
    price,
    isPriceLoading,
    isAccountLoading,
  } = useOverlayAccount(username);

  const [showCoinChange, setShowCoinChange] = useState(false);
  const [lastExtension, setLastExtension] = useState({ seconds: 0, cost: 0 });
  const [remainingTime, setRemainingTime] = useState(initialRentalTime);

  // Set up a countdown effect
  useEffect(() => {
    // Initialize with account's initial time
    setRemainingTime(initialRentalTime);

    // Only start the timer if there is time remaining
    if (initialRentalTime <= 0) {
      return;
    }

    // Create interval to decrease time every second
    const interval = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Clean up interval on unmount or when account changes
    return () => clearInterval(interval);
  }, [initialRentalTime, account?.documentId]);
  // Countdown timer effect

  // First, modify the handleExtend function to properly coordinate animations
  const handleExtend = (option: ExtensionOption, cost: number, seconds: number) => {
    // Prevent multiple clicks using the mutation's pending state
    if (isExtendPending) {
      return;
    }

    setLastExtension({ seconds, cost }); // Keep track for time animation

    handleExtendAccount(option.index);
  };
  const isLoading = isUsernameLoading || isAccountLoading || isPriceLoading;
  if (isLoading) {
    return <GameOverlaySkeleton setShowOverlay={setShowOverlay} opacity={opacity} scale={scale} />;
  }

  // If no account is found after loading completes, don't show the overlay
  if (!account) {
    return null;
  }

  const rankInfo = account.rankings?.find(rank => rank.queueType === 'soloqueue');

  return (
    <div
      ref={overlayRef}
      className="w-full h-full flex flex-col items-end overflow-hidden" // Ensure it fills space, align content
      style={{ '--wails-draggable': 'drag' } as any} // Apply drag to the whole area initially

    >
      <div
        className={cn(
          'rounded-lg overflow-hidden transition-all duration-300   backdrop-blur-md', // Added border/blur here
        )}
        style={{
          opacity: opacity / 100,
          transform: `scale(${scale / 100})`,
          transformOrigin: 'top right',
          // boxShadow: 'none', // You might want a subtle shadow for depth
        }}
      >
        {/* Header with Logo */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-900/80 to-blue-600/80 px-3 py-2">
          <div className="flex items-center gap-3">
            <img src={logoHexBoost} alt="Logo Hex Boost" className="w-6 h-6" />
            <span className="text-sm font-bold text-white">Nexus</span>
          </div>
          <div
            className="flex items-center gap-1"
            style={{ '--wails-draggable': 'no-drag' } as React.CSSProperties}
          >
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
        <div className="p-3 space-y-3 bg-background/80 backdrop-blur-md rounded-b-lg ">
          {/* User Info */}
          {user?.username && (
            <div className="flex gap-2 justify-start items-start">
              <Avatar>
                <AvatarImage
                  src={import.meta.env.VITE_API_URL + user.avatar?.url}
                  alt={user.username}
                />

                <AvatarFallback><Skeleton className="w-[72px] h-[72px]" /></AvatarFallback>
              </Avatar>

              <div className="flex flex-col gap-1">
                <div className="text-sm text-zinc-400">
                  <span className="text-white font-bold">{user?.username}</span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <CoinIcon className="h-3 w-3 text-amber-400" />
                  <div className="relative">
                    <AnimatedCoins coins={user.coins} className="text-amber-400 font-medium" />
                    {showCoinChange && (
                      <AnimatedCoinChange coins={lastExtension.cost} onComplete={() => setShowCoinChange(false)} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <motion.div
            className="flex items-center gap-3 bg-blue-950/50 p-2 rounded-md relative"
            initial={{ opacity: 1 }}
            animate={{
              opacity: isExtendPending ? 1 : 1,
              scale: isExtendPending ? [1, 1.02, 1] : 1,
              boxShadow: isExtendPending
                ? ['0 0 0 rgba(59, 130, 246, 0)', '0 0 15px rgba(59, 130, 246, 0.5)', '0 0 0 rgba(59, 130, 246, 0)']
                : '0 0 0 rgba(59, 130, 246, 0)',
            }}
            transition={{ duration: 1.5, delay: 1.5 }}
          >
            <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-white">Rental Time</span>

              </div>
              <div className="text-xs text-zinc-400 relative">
                <AnimatedTimeDisplay seconds={remainingTime} />
              </div>
            </div>

            {/* Pulse animation when extending */}
            {isExtendPending && (
              <motion.div
                className="absolute inset-0 rounded-md pointer-events-none border border-green-500"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0, 0.5, 0],
                  scale: [0.8, 1.1, 1.2],
                }}
                transition={{
                  duration: 1,
                  delay: 1.5,
                  ease: 'easeOut',
                }}
              />
            )}
          </motion.div>

          {/* -Extend Options */}
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Quick-Extend:</span>
            </div>
            {price && rankInfo && (
              <QuickExtendButtons
                userCoins={user?.coins}
                onExtend={handleExtend}
                isExtending={isExtendPending}
                rankElo={rankInfo.elo}
                priceData={price}
              />
            )}
          </div>

          {/* Account ID */}
          <div className="flex justify-between items-center">
            <span className="text-xs  text-muted-foreground font-medium">Username</span>
            <Badge variant="outline" className="text-xs bg-blue-950/50 text-blue-300 border-blue-800">
              {account?.username}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
