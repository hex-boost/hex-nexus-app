'use client';

import type { AccountType, UserType } from '@/types/types.ts';
import type React from 'react';
import { AccountCard } from '@/AccountCard.tsx';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea.tsx';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

type FavoriteAccountsProps = {
  accounts?: AccountType[];
  className?: string;
  onViewAll?: () => void;
  user?: UserType; // Add user prop
};

export default function FavoriteAccounts({
  accounts,
  className,
  user, // Receive user prop
}: FavoriteAccountsProps) {
  // State for managing the note dialog
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountType | null>(null);
  const [noteText, setNoteText] = useState('');
  // Use the favorites hook
  const { updateFavoriteNote, removeFavorite } = useFavorites();

  // Handle opening the note dialog
  const handleOpenNoteDialog = (e: React.MouseEvent, account: AccountType) => {
    e.stopPropagation();
    setSelectedAccount(account);
    setNoteText(account.note || '');
    setIsNoteDialogOpen(true);
  };

  // Handle removing from favorites
  const handleRemoveFromFavorites = (e: React.MouseEvent, account: AccountType) => {
    e.stopPropagation();
    if (!account.favoriteId) {
      console.error('No favoriteId available');
      return;
    }
    removeFavorite.mutate(account.favoriteId);
  };

  // Handle saving the note
  const handleSaveNote = () => {
    if (!selectedAccount?.favoriteId) {
      console.error('No favoriteId available');
      return;
    }

    updateFavoriteNote.mutate({
      favoriteId: selectedAccount.favoriteId,
      note: noteText,
    }, {
      onSuccess: () => {
        setIsNoteDialogOpen(false);
      },
    });
  };

  // Function to handle account changes (needed for onAccountChange prop)
  const handleAccountChange = async () => {
    // This will be handled by the React Query cache invalidation
  };

  // Helper function to get solo queue ranking

  return (
    <div className={cn('w-full', className)}>
      <div className="space-y-3 px-6">
        {accounts && accounts.slice(0, 3).map((account) => {
          const ranking = getSoloQueueRanking(account);

          return (
            <AccountCard
              key={account.id}
              id={account.id}
              documentId={account.documentId}
              gameType="lol"
              ranking={ranking}
              server={account.server || account.tagline}
              championsCount={account.LCUchampions?.length || 0}
              skinsCount={account.LCUskins?.length || 0}
              mode="favorite"
              isFavorite
              price={account.price}
              status={account.status === 'Reserved' || account.status === 'Maintenance' ? 'Available' : account.status || 'Available'}
              note={account.note}
              onClick={() => void 0}
              onEditNote={e => handleOpenNoteDialog(e, account)}
              onRemoveFromFavorites={e => handleRemoveFromFavorites(e, account)}
              account={account} // Pass the account object
              user={user} // Pass the user object
              onAccountChange={handleAccountChange}
            />
          );
        })}
      </div>

      <Link
        to="/accounts/favorites"
        className="w-full flex bg-white/[0.01] text-sm text-muted-foreground hover:text-white py-2 items-center hover:bg-white/5 justify-center mt-6 rounded-bl-xl rounded-br-xl"
      >
        <span>View All Favorites</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>

      {/* Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{noteText ? 'Edit Note' : 'Add Note'}</DialogTitle>
            <DialogDescription>
              Add a personal note about this account to help you remember important details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Enter your note here..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              className="min-h-[100px] resize-none "
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNoteDialogOpen(false)}
              disabled={updateFavoriteNote.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveNote}
              disabled={updateFavoriteNote.isPending}
            >
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
