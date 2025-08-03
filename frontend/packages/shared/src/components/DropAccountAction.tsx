import type { AccountType, UserType } from '@/types/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.tsx';
import { useAccountActions } from '@/hooks/useAccountActions.ts';
import { useAccountStore } from '@/stores/useAccountStore.ts';
import { ArrowDownToLine } from 'lucide-react';
import { useState } from 'react';

export type DropAccountActionProps = {
  isAccountRented?: boolean;
  account: AccountType;
  user: UserType | null;
  onSuccess?: () => Promise<void>;
  variant?: 'button' | 'dropdown';
  asChild?: boolean;
  accountRentalDocumentId?: string;
  children?: React.ReactNode;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
};

export function DropAccountAction({
  accountRentalDocumentId,
  account,
  isAccountRented,
  children,
  buttonVariant = 'outline',
}: DropAccountActionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isNexusAccount } = useAccountStore();
  const { dropRefund, handleDropAccount, isDropPending } = useAccountActions({ isAccountRented, accountRentalId: accountRentalDocumentId, account });

  // Determine if button should be disabled
  const isDisabled = isDropPending || !isAccountRented;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={buttonVariant}
          className="flex items-center gap-1"
        >
          {children || (
            <>
              <ArrowDownToLine className="h-4 w-4" />
              Drop Account
            </>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Drop Account</DialogTitle>
          <DialogDescription>
            Are you sure you want to drop this account?
            <br />
            {' '}
            You will be refunded
            {' '}
            <span className="text-blue-300">{dropRefund?.amount.toLocaleString()}</span>
            {' '}
            coins.
          </DialogDescription>
        </DialogHeader>

        {isNexusAccount && (
          <div
            className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md p-3 text-sm text-amber-800 dark:text-amber-300"
          >
            <p>
              Your League of Legends will close
            </p>
          </div>
        )}

        <DialogFooter className="flex gap-3 sm:justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={isDropPending}
            disabled={isDisabled}
            onClick={() => handleDropAccount({})}
            className="flex items-center gap-1"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
