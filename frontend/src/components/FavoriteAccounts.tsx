'use client';

import type { UserType } from '@/types/types.ts';
import { AccountCard } from '@/AccountCard.tsx';
import { NoFavoritesFound } from '@/components/empty-states';
import { ScrollArea } from '@/components/ui/scroll-area.tsx';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';

type FavoriteAccountsProps = {
  className?: string;
  onViewAll?: () => void;
  user: UserType;
};

export default function FavoriteAccounts({
  className,
  user,
}: FavoriteAccountsProps) {
  // State for managing the note dialog
  const navigate = useNavigate();

  // Function to handle account changes
  const handleAccountChange = async () => {
    // Refresh logic would go here
    console.warn('Account status changed');
  };

  // Function to handle browsing accounts
  const handleBrowseAccounts = () => {
    navigate({ to: '/accounts' });
  };

  const hasFavorites = user.favoriteAccounts && user.favoriteAccounts.length > 0;

  return (
    <>
      <div className={cn('w-full flex flex-col h-full relative', className)}>
        <ScrollArea className="flex-1 overflow-y-auto scrollbar-hide ">
          {hasFavorites
            ? (
                <div className="space-y-3 px-6 overflow-y-auto max-h-[350px]">
                  {user.favoriteAccounts.map((favorite) => {
                    const account = favorite.riot_account;
                    if (!account) {
                      return null;
                    }

                    return (
                      <div key={account.id}>
                        <AccountCard
                          showPrice
                          key={account.id}
                          riotAccount={account}
                          gameType="lol"
                          onAccountChange={handleAccountChange}
                        />
                      </div>
                    );
                  })}
                </div>
              )
            : (
                <div className="px-6 py-4">
                  <NoFavoritesFound onBrowse={handleBrowseAccounts} />
                </div>
              )}
        </ScrollArea>

        {hasFavorites && true && (
          <Link
            to="/accounts/favorites"
            className="block w-full py-2 text-sm text-muted-foreground hover:text-foreground bg-background h hover:bg-gray-100 dark:hover:bg-background/95 justify-center rounded-bl-xl rounded-br-xl transition-colors border-t border-gray-200 dark:border-[#1F1F23]"
          >
            <div className="flex justify-center items-center">
              <span>View All Favorites</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </div>
          </Link>
        )}
      </div>
    </>
  );
}
