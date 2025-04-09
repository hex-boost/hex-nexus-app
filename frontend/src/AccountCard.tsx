import type { Server } from '@/types/types.ts';
import { CoinIcon } from '@/components/coin-icon.tsx';
import { DropAccountAction } from '@/components/DropAccountAction';
import { AccountGameIcon } from '@/components/GameComponents';
import { GameRankDisplay } from '@/components/GameRankDisplay.tsx';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useDateTime } from '@/hooks/useDateTime.ts';
import { useMapping } from '@/lib/useMapping.tsx';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore.ts';
import { Link } from '@tanstack/react-router';
import { Clock, FileText, MoreHorizontal, Star } from 'lucide-react';
import React from 'react';
import { cls } from 'react-image-crop';

export type AccountCardStatus = 'Available' | 'Rented';

export type AccountCardProps = {
  id: string;
  documentId: string;
  gameType: string;
  ranking: any;
  server: Server;
  championsCount: number;
  skinsCount: number;
  className?: string;
  onClick?: () => void;

  // Mode-specific props
  mode: 'rented' | 'favorite';

  // For rented accounts
  expirationDate?: string;

  // For favorite accounts
  isFavorite?: boolean;
  price?: number;
  status?: AccountCardStatus;
  note?: string;
  onEditNote?: (e: React.MouseEvent) => void;
  onRemoveFromFavorites?: (e: React.MouseEvent) => void;

  // Account object for DropAccountAction
  account?: any;
  user?: any;
  onAccountChange?: () => Promise<void>;
};

export function AccountCard({
  id,
  documentId,
  gameType,
  ranking,
  server,
  championsCount,
  skinsCount,
  className,
  onClick,
  mode,
  expirationDate,
  isFavorite = false,
  price,
  status,
  note,
  onEditNote,
  onRemoveFromFavorites,
  account,
  onAccountChange,
}: AccountCardProps) {
  const { getFormattedServer } = useMapping();
  const { getFormattedTimeRemaining } = useDateTime();
  const { getStatusColor } = useMapping();
  const { user } = useUserStore();
  const cardContent = (
    <div
      className={cn(
        'flex w-full border bg-white/0.01 p-3 rounded-lg',
        'hover:bg-zinc-100/5 dark:hover:bg-primary/10 cursor-pointer',
        'transition-all duration-200',
        className,
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 w-full">
        <div className="relative">
          <AccountGameIcon className="min-w-fit" size={36} game={gameType} />
        </div>

        <div className="w-full space-y-0.5">
          <div className="w-full flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium uppercase text-zinc-900 dark:text-zinc-100">
                {id.slice(0, 6)}
              </h3>

              {mode === 'favorite' && status && (
                <Badge className={cn('text-[10px] px-1.5 py-0', getStatusColor(status))}>
                  {status}
                </Badge>
              )}

              <Star className={cls(' w-3 h-3  text-amber-500', isFavorite && 'fill-amber-500')} />

              {mode === 'favorite' && note && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-help" onClick={e => e.stopPropagation()}>
                        <FileText className="h-3.5 w-3.5 text-zinc-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">{note}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="text-right flex flex-col items-end">
              {mode === 'rented' && expirationDate && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    {getFormattedTimeRemaining(expirationDate)}
                  </span>
                </div>
              )}

              {mode === 'favorite' && price !== undefined && (
                <div className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  <CoinIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  {price.toLocaleString()}
                </div>
              )}
            </div>
          </div>

          {/* Bottom row: rank, server, champions, skins */}
          <div className="text-xs font-medium justify-between w-full items-center text-zinc-600 dark:text-zinc-400 flex gap-2">
            <div className="min-w-fit flex gap-2 items-center">
              <GameRankDisplay imageClass="w-4.5 h-4.5" showLP={false} ranking={ranking} />
              <div className="w-1 h-1 rounded-full bg-shade4"></div>
              <div className="py-1 px-1.5 text-[9px] bg-muted text-shade1 rounded-sm font-bold">
                {getFormattedServer(server)}
              </div>
            </div>

            <div className="min-w-fit flex gap-2 items-center">
              <span>
                {championsCount}
                {' '}
                Champions
              </span>
              <div className="w-1 h-1 rounded-full bg-muted-foreground/70"></div>
              {skinsCount}
              {' '}
              Skins

            </div>
          </div>

        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-1">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {mode === 'rented' && account && user && (
              <DropdownMenuItem asChild>
                <DropAccountAction
                  account={account}
                  user={user}
                  onSuccess={onAccountChange}
                  variant="dropdown"
                  asChild
                >
                  Drop Account
                </DropAccountAction>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={onEditNote}>
              {note ? 'Edit Note' : 'Add Note'}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onRemoveFromFavorites}
              className="text-red-500 focus:text-red-500"
            >
              Remove from Favorites
            </DropdownMenuItem>

          </DropdownMenuContent>

        </DropdownMenu>
      </div>
    </div>
  );

  // If documentId is provided, wrap in Link, otherwise return the content directly
  return (
    <Link to={`/accounts/${documentId}`} className="block">
      {cardContent}
    </Link>
  );
}
