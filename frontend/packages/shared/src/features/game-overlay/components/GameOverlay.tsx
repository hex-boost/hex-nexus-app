import type {ExtensionOption} from '../../../components/extend-rental.ts';
import logoHexBoost from '@/assets/logo-hex-boost.svg';

import {
    AnimatedCoinChange,
    AnimatedCoins,
    AnimatedTimeChange,
    AnimatedTimeDisplay,
} from '@/components/AnimatedNumber.tsx';
import {CoinIcon} from '@/components/coin-icon.tsx';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar.tsx';
import {Badge} from '@/components/ui/badge.tsx';
import {Button} from '@/components/ui/button.tsx';
import {Skeleton} from '@/components/ui/skeleton.tsx';
import {TooltipProvider} from '@/components/ui/tooltip.tsx';
import {QuickExtendButtons} from '@/features/game-overlay/components/GameOverlayQuickExtend.tsx';
import {GameOverlaySkeleton} from '@/features/game-overlay/components/GameOverlaySkeleton.tsx';
import {useOverlayAccount} from '@/hooks/useOverlayAccount.ts';
import {cn} from '@/lib/utils.ts';
import {useUserStore} from '@/stores/useUserStore.ts';
import {Monitor as AccountMonitor} from '@account';
import {useQuery} from '@tanstack/react-query';
import {motion} from 'framer-motion';
import {Clock, XIcon} from 'lucide-react';
import React, {useEffect, useState} from 'react';

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
  const { data: username, isLoading: isUsernameLoading } = useQuery({
    queryKey: ['loggedInUsername'],
    queryFn: async () => {
      return AccountMonitor.GetLoggedInUsername("");
    },
  });

  const { user } = useUserStore();
  const [userCoins, setUserCoins] = useState(user?.coins || 0);

  const {
    account,
    initialRentalTime,
    handleExtendAccount,
    isExtendPending,
    price,
    isPriceLoading,
    isAccountLoading,
    dropRefund,
  } = useOverlayAccount(username);

  const [rentalTimeRemaining, setRentalTimeRemaining] = useState(0);
  const [isExtending, setIsExtending] = useState(false);
  const [showTimeChange, setShowTimeChange] = useState(false);
  const [showCoinChange, setShowCoinChange] = useState(false);
  const [lastExtension, setLastExtension] = useState({ seconds: 0, cost: 0 });

  // Set initial time when data is loaded
  useEffect(() => {
    if (initialRentalTime > 0) {
      setRentalTimeRemaining(initialRentalTime);
    }
  }, [initialRentalTime]);

  // Countdown timer effect
  useEffect(() => {
    // Only start the countdown if we have time remaining
    if (rentalTimeRemaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      setRentalTimeRemaining((prevTime) => {
        // Stop at zero to prevent negative values
        if (prevTime <= 0) {
          clearInterval(interval);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Cleanup the interval when component unmounts or dependencies change
    return () => clearInterval(interval);
  }, [rentalTimeRemaining]); // Only reset the timer when we go from 0 to positive or vice versa

  // Update user coins from store when they change
  useEffect(() => {
    if (user?.coins !== undefined) {
      setUserCoins(user.coins);
    }
  }, [user?.coins]);

  const handleExtend = (option: ExtensionOption, cost: number, seconds: number) => {
    // Set extending state to true to disable buttons during animation
    setIsExtending(true);
    setLastExtension({ seconds, cost });

    // Show the animated indicators
    setShowTimeChange(true);
    setShowCoinChange(true);

    // Immediately update the UI with the changes
    setRentalTimeRemaining(prev => prev + seconds);

    // Call the optimistic update handler from the hook
    // This will update the cache and make the API call in the background
    handleExtendAccount(option.index);

    // Reset extending state after animation completes
    setTimeout(() => {
      setIsExtending(false);
      setShowTimeChange(false);
      setShowCoinChange(false);
    }, 1300);
  };

  // Show skeleton loading state if any data is still loading
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
    <TooltipProvider>
      <div
        className="fixed  z-50 flex flex-col items-end backdrop-blur-2xl"

        style={{
          'opacity': opacity / 100,
          'transform': `scale(${scale / 100})`,
          'transformOrigin': 'top right',
          '--wails-draggable': 'drag',
        } as any}
      >
        <div
          className={cn(
            'rounded-lg overflow-hidden transition-all duration-300',
          )}
          style={{
            boxShadow: 'none',
          }}
        >
          {/* Header with Logo */}
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-900/95 to-blue-600/95 px-3 py-2 rounded-t-lg">
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
          <div className="p-3 space-y-3 bg-background/95 backdrop-blur-md rounded-b-lg border border-blue-500/50">
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
                      <AnimatedCoins coins={userCoins} className="text-amber-400 font-medium" />
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
                opacity: isExtending ? 1 : 1,
                scale: isExtending ? [1, 1.02, 1] : 1,
                boxShadow: isExtending
                  ? ['0 0 0 rgba(59, 130, 246, 0)', '0 0 15px rgba(59, 130, 246, 0.5)', '0 0 0 rgba(59, 130, 246, 0)']
                  : '0 0 0 rgba(59, 130, 246, 0)',
              }}
              transition={{ duration: 1.5 }}
            >
              <div className="w-10 h-10 rounded-full bg-blue-900/50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-white">Rental Time</span>

                </div>
                <div className="text-xs text-zinc-400 relative">
                  <AnimatedTimeDisplay seconds={rentalTimeRemaining} />
                  {showTimeChange && (
                    <AnimatedTimeChange seconds={lastExtension.seconds} onComplete={() => setShowTimeChange(false)} />
                  )}
                </div>
              </div>

              {/* Pulse animation when extending */}
              {isExtending && (
                <motion.div
                  className="absolute inset-0 rounded-md pointer-events-none border border-green-500"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{
                    opacity: [0, 0.5, 0],
                    scale: [0.8, 1.1, 1.2],
                  }}
                  transition={{
                    duration: 1,
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
                  userCoins={userCoins}
                  onExtend={handleExtend}
                  isExtending={isExtending || isExtendPending}
                  rankElo={rankInfo.elo}
                  priceData={price}
                />
              )}
            </div>

            {/* Refund information if available */}
            {dropRefund && dropRefund.amount > 0 && (
              <div className="flex justify-between items-center bg-green-950/30 p-2 rounded-md">
                <span className="text-xs text-green-400">Refund on drop:</span>
                <Badge variant="outline" className="text-xs bg-green-950/50 text-green-300 border-green-800">
                  {dropRefund.amount}
                  {' '}
                  coins
                </Badge>
              </div>
            )}

            {/* Account ID */}
            <div className="flex justify-between items-center">
              <span className="text-xs  text-muted-foreground font-medium">Account ID:</span>
              <Badge variant="outline" className="text-xs bg-blue-950/50 text-blue-300 border-blue-800">
                {account?.documentId.slice(0, 6)}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
