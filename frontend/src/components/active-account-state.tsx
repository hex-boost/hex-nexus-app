import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { AlertTriangle, ArrowDownToLine, Ban, ChevronDown, ChevronUp, Clock, LogIn, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { CoinIcon } from './coin-icon';

type AccountActiveStateProps = {
  accountId: string;
  game: 'lol' | 'valorant';
  rentedAt: string;
  expiresAt: string;
  gameName?: string;
  refundableAmount: number;
  leaverBusterStatus: 'None' | 'Low' | 'Medium' | 'High';
  soloQueueRank?: {
    tier: string;
    rank: string;
    lp: number;
  };
  flexQueueRank?: {
    tier: string;
    rank: string;
    lp: number;
  };
  previousSeasonRank?: {
    tier: string;
    rank: string;
    season: number;
  };
  valorantRank?: {
    tier: string;
    rank: string;
  };
};

// Helper function to format time remaining
const formatTimeRemaining = (milliseconds: number) => {
  if (milliseconds <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  const seconds = Math.floor((milliseconds / 1000) % 60);
  const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
  const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
  const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds };
};

// Helper function to get rank color
const getRankColor = (tier: string) => {
  switch (tier.toLowerCase()) {
    case 'iron':
    case 'bronze':
      return 'text-zinc-600 dark:text-zinc-400';
    case 'silver':
      return 'text-zinc-400 dark:text-zinc-300';
    case 'gold':
      return 'text-amber-500 dark:text-amber-400';
    case 'platinum':
      return 'text-cyan-500 dark:text-cyan-400';
    case 'diamond':
      return 'text-blue-500 dark:text-blue-400';
    case 'master':
      return 'text-purple-500 dark:text-purple-400';
    case 'grandmaster':
      return 'text-red-500 dark:text-red-400';
    case 'challenger':
    case 'radiant':
      return 'text-yellow-500 dark:text-yellow-400';
    case 'immortal':
      return 'text-red-500 dark:text-red-400';
    case 'ascendant':
      return 'text-emerald-500 dark:text-emerald-400';
    default:
      return 'text-zinc-600 dark:text-zinc-400';
  }
};

// Helper function to get tier icon
const getTierIcon = (tier: string) => {
  // In a real app, you would use actual tier icons
  return `/placeholder.svg?height=24&width=24&text=${tier.charAt(0)}`;
};

// Helper function to get game icon
const getGameIcon = (game: 'lol' | 'valorant') => {
  if (game === 'lol') {
    return '/placeholder.svg?height=24&width=24&text=LoL';
  } else {
    return '/placeholder.svg?height=24&width=24&text=VAL';
  }
};

// Helper function to get leaver buster status info
const getLeaverBusterInfo = (status: 'None' | 'Low' | 'Medium' | 'High') => {
  switch (status) {
    case 'None':
      return {
        color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        icon: Shield,
        description: 'This account has no leaver buster penalties.',
      };
    case 'Low':
      return {
        color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        icon: AlertTriangle,
        description: 'This account has a low-priority queue of 5 minutes for 3 games.',
      };
    case 'Medium':
      return {
        color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
        icon: AlertTriangle,
        description: 'This account has a low-priority queue of 10 minutes for 5 games.',
      };
    case 'High':
      return {
        color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        icon: Ban,
        description: 'This account has a low-priority queue of 20 minutes for 5 games.',
      };
  }
};

export default function AccountActiveState({
  accountId,
  game,
  rentedAt,
  expiresAt,
  gameName,
  refundableAmount,
  leaverBusterStatus,
  soloQueueRank,
  flexQueueRank,
  previousSeasonRank,
  valorantRank,
}: AccountActiveStateProps) {
  const [timeRemaining, setTimeRemaining] = useState<ReturnType<typeof formatTimeRemaining>>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [percentageRemaining, setPercentageRemaining] = useState(100);
  const [isOpen, setIsOpen] = useState(false);
  const [isDropDialogOpen, setIsDropDialogOpen] = useState(false);

  // Calculate time remaining
  useEffect(() => {
    const rentedDate = new Date(rentedAt).getTime();
    const expiryDate = new Date(expiresAt).getTime();
    const totalDuration = expiryDate - rentedDate;

    const updateTimer = () => {
      const now = new Date().getTime();
      const remaining = expiryDate - now;

      if (remaining <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setPercentageRemaining(0);
        return;
      }

      setTimeRemaining(formatTimeRemaining(remaining));
      setPercentageRemaining(Math.round((remaining / totalDuration) * 100));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [rentedAt, expiresAt]);

  const leaverBusterInfo = getLeaverBusterInfo(leaverBusterStatus);
  const LeaverIcon = leaverBusterInfo.icon;

  // Handle login to game
  const handleLogin = () => {
    // In a real app, this would integrate with the game client
    alert(`Logging in to ${game === 'lol' ? 'League of Legends' : 'Valorant'} with account: ${accountId}`);
  };

  // Handle extend rental
  // const handleExtendRental = () => {
  //   // In a real app, this would navigate to the extension page
  //   alert(`Extending rental for account: ${accountId}`);
  // };

  // Handle drop account
  const handleDropAccount = () => {
    setIsDropDialogOpen(false);
    alert(`Account ${accountId} has been dropped. ${refundableAmount} coins have been refunded.`);
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1">
            Active
          </Badge>
          <div className="flex items-center gap-2">
            <img
              src={getGameIcon(game) || '/placeholder.svg'}
              alt={game === 'lol' ? 'League of Legends' : 'Valorant'}
              className="w-5 h-5"
            />
            <span className="text-sm font-medium">{accountId}</span>
          </div>
        </div>
        <CardTitle className="text-xl mt-2">
          {gameName
            ? (
              <span className="font-bold">{gameName}</span>
            )
            : (
              <span className="text-zinc-500 dark:text-zinc-400 italic">Game name hidden until login</span>
            )}
        </CardTitle>
        <CardDescription>
          Rented account - Expires in
          {' '}
          {timeRemaining.days > 0 ? `${timeRemaining.days}d ` : ''}
          {timeRemaining.hours}
          h
          {timeRemaining.minutes}
          m
          {timeRemaining.seconds}
          s
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Time remaining progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Time Remaining
            </span>
            <span className="font-medium">
              {percentageRemaining}
              %
            </span>
          </div>
          <Progress value={percentageRemaining} className="h-2" />
        </div>

        {/* Rank information */}
        <div className="grid grid-cols-2 gap-3">
          {game === 'lol' ? (
            <>
              {/* Solo Queue Rank */}
              <div className="bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-md">
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Solo Queue</p>
                {soloQueueRank
                  ? (
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getTierIcon(soloQueueRank.tier) || '/placeholder.svg'}
                        alt={soloQueueRank.tier}
                        className="w-5 h-5"
                      />
                      <div>
                        <p className={`text-sm font-medium ${getRankColor(soloQueueRank.tier)}`}>
                          {soloQueueRank.tier}
                          {' '}
                          {soloQueueRank.rank}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {soloQueueRank.lp}
                          {' '}
                          LP
                        </p>
                      </div>
                    </div>
                  )
                  : previousSeasonRank
                    ? (
                      <div className="flex items-center gap-1.5">
                        <img
                          src={getTierIcon(previousSeasonRank.tier) || '/placeholder.svg'}
                          alt={previousSeasonRank.tier}
                          className="w-5 h-5 opacity-70"
                        />
                        <div>
                          <p className={`text-sm font-medium ${getRankColor(previousSeasonRank.tier)} opacity-70`}>
                            Unranked
                          </p>
                          <p className="text-xs text-zinc-600 dark:text-zinc-400">
                            S
                            {previousSeasonRank.season}
                            :
                            {' '}
                            {previousSeasonRank.tier}
                            {' '}
                            {previousSeasonRank.rank}
                          </p>
                        </div>
                      </div>
                    )
                    : (
                      <p className="text-sm text-zinc-600 dark:text-zinc-400">Unranked</p>
                    )}
              </div>

              {/* Flex Queue Rank */}
              <div className="bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-md">
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Flex Queue</p>
                {flexQueueRank
                  ? (
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getTierIcon(flexQueueRank.tier) || '/placeholder.svg'}
                        alt={flexQueueRank.tier}
                        className="w-5 h-5"
                      />
                      <div>
                        <p className={`text-sm font-medium ${getRankColor(flexQueueRank.tier)}`}>
                          {flexQueueRank.tier}
                          {' '}
                          {flexQueueRank.rank}
                        </p>
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {flexQueueRank.lp}
                          {' '}
                          LP
                        </p>
                      </div>
                    </div>
                  )
                  : (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Unranked</p>
                  )}
              </div>
            </>
          ) : (
            <>
              {/* Valorant Rank */}
              <div className="bg-zinc-50 dark:bg-zinc-800/30 p-2 rounded-md col-span-2">
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">Competitive Rank</p>
                {valorantRank
                  ? (
                    <div className="flex items-center gap-1.5">
                      <img
                        src={getTierIcon(valorantRank.tier) || '/placeholder.svg'}
                        alt={valorantRank.tier}
                        className="w-5 h-5"
                      />
                      <div>
                        <p className={`text-sm font-medium ${getRankColor(valorantRank.tier)}`}>
                          {valorantRank.tier}
                          {' '}
                          {valorantRank.rank}
                        </p>
                      </div>
                    </div>
                  )
                  : (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Unranked</p>
                  )}
              </div>
            </>
          )}
        </div>

        {/* Leaver Buster Status */}
        <div className={cn('flex items-center gap-2 p-2 rounded-md text-sm', leaverBusterInfo.color)}>
          <LeaverIcon className="h-4 w-4" />
          <span>{leaverBusterInfo.description}</span>
        </div>

        {/* Collapsible section with refundable amount */}
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="border rounded-md">
          <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-sm font-medium">
            Account Summary
            {isOpen
              ? (
                <ChevronUp className="h-4 w-4 text-zinc-500" />
              )
              : (
                <ChevronDown className="h-4 w-4 text-zinc-500" />
              )}
          </CollapsibleTrigger>
          <CollapsibleContent className="p-3 pt-0 border-t">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Refundable Amount</span>
                <div className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                  <CoinIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  {refundableAmount.toLocaleString()}
                  {' '}
                  coins
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Rental Start</span>
                <span className="text-sm text-zinc-900 dark:text-zinc-50">{new Date(rentedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Rental End</span>
                <span className="text-sm text-zinc-900 dark:text-zinc-50">{new Date(expiresAt).toLocaleString()}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      <CardFooter className="flex gap-3">
        <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleLogin}>
          <LogIn className="mr-2 h-4 w-4" />
          Login to
          {' '}
          {game === 'lol' ? 'LoL' : 'Valorant'}
        </Button>

        <Dialog open={isDropDialogOpen} onOpenChange={setIsDropDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-1">
              <ArrowDownToLine className="h-4 w-4" />
              Drop
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Drop Account & Refund</DialogTitle>
              <DialogDescription>
                Are you sure you want to drop this account? You will be refunded
                {' '}
                {refundableAmount}
                {' '}
                coins.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm text-amber-800 dark:text-amber-300">
              <p>This action cannot be undone. The account will be immediately returned to the available pool.</p>
            </div>
            <DialogFooter className="flex gap-3 sm:justify-end">
              <Button variant="outline" onClick={() => setIsDropDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDropAccount} className="flex items-center gap-1">
                <ArrowDownToLine className="h-4 w-4" />
                Drop & Refund
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}
