import type { AccountType } from '@/types/types.ts';
import { CoinIcon } from '@/components/coin-icon.tsx';
import { DropAccountAction } from '@/components/DropAccountAction';
import { FavoriteAccountNote } from '@/components/FavoriteAccountNote.tsx';
import { FavoriteStar } from '@/components/FavoriteStar.tsx';
import { AccountGameIcon } from '@/components/GameComponents';
import { GameRankDisplay } from '@/components/GameRankDisplay.tsx';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton.tsx';
import { useDateTime } from '@/hooks/useDateTime.ts';
import { useFavoriteAccounts } from '@/hooks/useFavoriteAccounts.ts';
import { usePrice } from '@/hooks/usePrice.ts';
import { useRiotAccount } from '@/hooks/useRiotAccount.ts';
import { useMapping } from '@/lib/useMapping.tsx';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore.ts';
import { Link } from '@tanstack/react-router';
import { Clock, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';

export type AccountCardProps = {
  gameType: string;
  className?: string;
  onClick?: () => void;
  // For rented accounts
  expirationDate?: string;
  // Base required props
  riotAccount: AccountType;
  // Optional callback for when account status changes
  onAccountChange?: () => Promise<void>;
  // Callback for note editing
  showPrice?: boolean;
};

export function AccountCard({
  gameType,
  showPrice = false,
  className,
  expirationDate,
  riotAccount,
  onAccountChange,
}: AccountCardProps) {
  const { currentRanking } = useRiotAccount({ account: riotAccount });

  const { getFormattedServer } = useMapping();
  const { getFormattedTimeRemaining } = useDateTime();
  const { getStatusColor } = useMapping();
  const { getFavoriteAccount, handleEditNote, handleDeleteNote, handleAddToFavorites, handleRemoveFromFavorites } = useFavoriteAccounts();
  const favoriteAccount = getFavoriteAccount(riotAccount);
  const isFavorite = !!favoriteAccount;
  // Add state for hover
  const [_, setIsHovering] = useState(false);

  const { user } = useUserStore();
  // Determine if account is a favorite internally

  const note = favoriteAccount?.note;

  // Handler to remove from favorites

  // Handle adding to favorites

  // Handle edit note

  const { price, getAccountPrice, isPriceLoading } = usePrice();

  const cardContent = (
    <div
      className={cn(
        'flex w-full border bg-white/0.01 p-3 rounded-lg',
        'hover:bg-zinc-100/5 dark:hover:bg-primary/10 cursor-pointer',
        'transition-all duration-200',
        className,
      )}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex items-center gap-3 w-full">
        <div className="relative">
          <AccountGameIcon className="min-w-fit" size={36} game={gameType} />
        </div>

        <div className="w-full space-y-0.5">
          <div className="w-full flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium uppercase text-zinc-900 dark:text-zinc-100">
                {riotAccount.documentId.slice(0, 6)}
              </h3>

              {isFavorite && showPrice && (
                <Badge className={cn('text-[10px] px-1.5 py-0', getStatusColor(riotAccount.user ? 'Rented' : 'Available'))}>
                  {riotAccount.user ? 'Rented' : 'Available'}
                </Badge>
              )}

              <FavoriteStar account={riotAccount} />
              <FavoriteAccountNote account={riotAccount} />
            </div>
            <div className="text-right flex flex-col items-end">
              {/* Changed condition: show expiration date whenever it exists, regardless of favorite status */}
              {expirationDate && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                    {getFormattedTimeRemaining(expirationDate)}
                  </span>
                </div>
              )}
              {showPrice && (
                isPriceLoading
                  ? (
                      <Skeleton />
                    )
                  : (
                      isFavorite && (
                        <div className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                          <CoinIcon className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          {getAccountPrice(price!, currentRanking?.elo)[1].price}
                        </div>
                      )
                    )
              )}
            </div>
          </div>

          {/* Bottom row: rank, server, champions, skins */}
          <div className="text-xs font-medium justify-between w-full items-center text-zinc-600 dark:text-zinc-400 flex gap-2">
            <div className="min-w-fit flex gap-2 items-center">
              <GameRankDisplay imageClass="w-4.5 h-4.5" showLP={false} ranking={currentRanking} />
              <div className="w-1 h-1 rounded-full bg-shade4"></div>
              <div className="py-1 px-1.5 text-[9px] bg-muted text-shade1 rounded-sm font-bold">
                {getFormattedServer(riotAccount.server)}
              </div>
            </div>

            <div className="min-w-fit flex gap-2 items-center">
              <span>
                {riotAccount.LCUchampions.length}
                {' '}
                Champions
              </span>
              <div className="w-1 h-1 rounded-full bg-muted-foreground/70"></div>
              {riotAccount.LCUskins.length}
              {' '}
              Skins
            </div>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            asChild
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 ml-1"
              onMouseEnter={e => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
            onMouseEnter={e => e.stopPropagation()}
          >
            {isFavorite && riotAccount && user && (
              <DropdownMenuItem
                asChild
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                }}
              >
                <DropAccountAction
                  account={riotAccount}
                  user={user}
                  onSuccess={onAccountChange}
                  variant="dropdown"
                  asChild
                >
                  Drop Account
                </DropAccountAction>
              </DropdownMenuItem>
            )}
            {
              isFavorite && (
                <>
                  <DropdownMenuItem onClick={() => {
                    handleEditNote(riotAccount);
                  }}
                  >
                    {note ? 'Edit Note' : 'Add Note'}
                  </DropdownMenuItem>

                  {
                    note
                    && (
                      <DropdownMenuItem onClick={() => {
                        handleDeleteNote(riotAccount);
                      }}
                      >
                        Delete Note
                      </DropdownMenuItem>
                    )
                  }
                </>
              )
            }

            {!isFavorite && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleAddToFavorites(riotAccount);
              }}
              >
                Add to favorites
              </DropdownMenuItem>
            )}

            {isFavorite && favoriteAccount?.documentId && (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (favoriteAccount?.documentId) {
                    handleRemoveFromFavorites(favoriteAccount?.documentId);
                  }
                }}
                className=""
              >
                Remove from Favorites
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  // If documentId is provided, wrap in Link, otherwise return the content directly
  return (
    <Link to={`/accounts/${riotAccount.documentId}`} className="block">
      {cardContent}
    </Link>
  );
}
