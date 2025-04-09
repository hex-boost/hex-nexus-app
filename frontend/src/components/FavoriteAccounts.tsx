'use client';

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
import { cn } from '@/lib/utils';
import { Link } from '@tanstack/react-router';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';

// Update the FavoriteAccount interface to include notes
type FavoriteAccount = {
  id: string;
  tier: string;
  rank: string;
  region: string;
  champions: number;
  skins: number;
  price: number;
  status: 'Available' | 'Rented' | 'Reserved' | 'Maintenance';
  documentId?: string;
  note?: string;
};

type FavoriteAccountsProps = {
  accounts?: FavoriteAccount[];
  className?: string;
  onViewAll?: () => void;
  user?: any; // Add user prop
};

// Update the sample data to include notes for some accounts
const FAVORITE_ACCOUNTS: FavoriteAccount[] = [
  {
    id: 'E3X8V6',
    tier: 'Challenger',
    rank: '',
    region: 'NA1',
    champions: 162,
    skins: 130,
    price: 7500,
    status: 'Available',
    note: 'Great account for high-level play. Has all the meta champions.',
  },
  {
    id: 'C2G7T4',
    tier: 'Master',
    rank: '',
    region: 'KR1',
    champions: 158,
    skins: 112,
    price: 5000,
    status: 'Available',
    note: 'Korean server account with good MMR.',
  },
  {
    id: 'A7F9P2',
    tier: 'Diamond',
    rank: 'II',
    region: 'EUW1',
    champions: 145,
    skins: 78,
    price: 3200,
    status: 'Rented',
  },
];

export default function FavoriteAccounts({
  accounts = FAVORITE_ACCOUNTS,
  className,
  user, // Receive user prop
}: FavoriteAccountsProps) {
  // State for managing the note dialog
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Handle view account details

  // Handle opening the note dialog
  const handleOpenNoteDialog = (e: React.MouseEvent, account: FavoriteAccount) => {
    e.stopPropagation();
    setSelectedAccountId(account.id);
    setNoteText(account.note || '');
    setIsNoteDialogOpen(true);
  };

  // Handle removing from favorites
  const handleRemoveFromFavorites = (e: React.MouseEvent, accountId: string) => {
    e.stopPropagation();
    // In a real app, this would remove the account from favorites
    console.log(`Removing account ${accountId} from favorites`);
  };

  // Handle saving the note
  const handleSaveNote = () => {
    // In a real app, this would update the note in the database
    console.log(`Saving note for account ${selectedAccountId}: ${noteText}`);
    setIsNoteDialogOpen(false);
  };

  // Function to handle account changes (needed for onAccountChange prop)
  const handleAccountChange = async () => {
    // In a real app, this would refresh the favorites list
    console.log('Account changed, should refresh favorites');
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="space-y-3 px-6">
        {accounts.slice(0, 3).map(account => (
          <AccountCard
            key={account.id}
            id={account.id}
            documentId={account.documentId!}
            gameType="lol"
            ranking={{ tier: account.tier, division: account.rank }}
            server={account.region as any}
            championsCount={account.champions}
            skinsCount={account.skins}
            mode="favorite"
            isFavorite
            price={account.price}
            status={account.status === 'Reserved' || account.status === 'Maintenance' ? 'Available' : account.status}
            note={account.note}
            onClick={() => void 0}
            onEditNote={e => handleOpenNoteDialog(e, account)}
            onRemoveFromFavorites={e => handleRemoveFromFavorites(e, account.id)}
            account={account} // Pass the account object
            user={user} // Pass the user object
            onAccountChange={handleAccountChange}
          />
        ))}
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
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNote}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
