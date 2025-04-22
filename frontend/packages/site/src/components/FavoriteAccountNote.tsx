import type { AccountType } from '@/types/types.ts';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip.tsx';
import { useFavoriteAccounts } from '@/hooks/useFavoriteAccounts.ts';
import { FileText } from 'lucide-react';
import { useState } from 'react';
import { cls } from 'react-image-crop';

export function FavoriteAccountNote({ account }: { account: AccountType }) {
  const { getFavoriteAccount, handleEditNote } = useFavoriteAccounts();
  const [isNoteHovering, setIsNoteHovering] = useState(false);
  const favoriteAccount = getFavoriteAccount(account);
  const note = favoriteAccount?.note;
  const isFavorite = !!favoriteAccount;

  return (
    <>
      {isFavorite && (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onMouseEnter={() => setIsNoteHovering(true)}
                onMouseLeave={() => setIsNoteHovering(false)}

                type="button"
                className=" p-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleEditNote(account);
                }}
              >
                <FileText className={cls('h-4 w-4 text-zinc-500 ', isNoteHovering && 'text-foreground')} />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{note || 'Click to create a note'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );
}
