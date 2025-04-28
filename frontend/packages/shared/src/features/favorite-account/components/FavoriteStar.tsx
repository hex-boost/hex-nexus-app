// frontend/src/components/FavoriteStar.tsx
import type { AccountType } from '@/types/types.ts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { useFavoriteAccounts } from '@/hooks/useFavoriteAccounts.ts';
import { cn } from '@/lib/utils.ts';
import { Star } from 'lucide-react';
import { useCallback, useState } from 'react';

export function FavoriteStar({
  account,
}: {
  account: AccountType;
}) {
  const [isStarHovering, setIsStarHovering] = useState(false);
  const { getFavoriteAccount, handleAddToFavorites, handleRemoveFromFavorites, setFavoriteAccountId } = useFavoriteAccounts();
  const favoriteAccount = getFavoriteAccount(account);
  const favoriteDocumentId = favoriteAccount?.documentId;
  const isFavorite = !!favoriteAccount;

  const handleStarClick = useCallback((e: React.MouseEvent) => {
    // Ensure event propagation is stopped
    e.stopPropagation();
    e.preventDefault();

    if (isFavorite && favoriteDocumentId) {
      handleRemoveFromFavorites(favoriteDocumentId);
    } else {
      handleAddToFavorites(account);
    }
  }, [isFavorite, favoriteDocumentId, account, handleAddToFavorites, handleRemoveFromFavorites, setFavoriteAccountId]);

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="relative p-0.5 " // Added cursor-pointer to always show the pointer
            onMouseEnter={() => setIsStarHovering(true)}
            onMouseLeave={() => setIsStarHovering(false)}
            onClick={handleStarClick}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star
              className={cn(
                'w-4 h-4 transition-all duration-300',
                isFavorite
                  ? 'text-amber-500 fill-amber-500 hover:scale-125' // Added hover scale effect when favorite
                  : isStarHovering
                    ? 'text-amber-500 opacity-100 hover:scale-125'
                    : 'opacity-50',
              )}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent className="text-sm">
          {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
