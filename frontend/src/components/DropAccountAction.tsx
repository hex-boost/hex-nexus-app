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
import { useCommonFetch } from '@/hooks/useCommonFetch.ts';
import { useGoState } from '@/hooks/useGoBindings.ts';
import { strapiClient } from '@/lib/strapi';
import { useAccountStore } from '@/stores/useAccountStore.ts';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowDownToLine } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export type DropAccountActionProps = {
  account: AccountType;
  user?: UserType;
  onSuccess?: () => Promise<void>;
  variant?: 'button' | 'dropdown';
  asChild?: boolean;
  children?: React.ReactNode;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
};

export function DropAccountAction({
  account,
  user,
  onSuccess,
  children,
  buttonVariant = 'outline',
}: DropAccountActionProps) {
  const { refetchUser } = useCommonFetch();
  const { Utils } = useGoState();
  const [isOpen, setIsOpen] = useState(false);
  const { isNexusAccount } = useAccountStore();

  // Get refund amount
  const { data: dropRefund } = useQuery({
    queryKey: ['accounts', 'refund', account.id],
    queryFn: () => strapiClient.find<{ amount: number }>(`accounts/${account?.documentId}/refund`)
      .then(res => res.data),
    enabled: !!account.documentId && isOpen && account.user?.documentId === user?.documentId,
    staleTime: 0,
  });
  // Handle dialog open

  // Drop account mutation
  const { mutate: handleDropAccount, isPending } = useMutation({
    mutationKey: ['accounts', 'drop', account.documentId],
    mutationFn: async () => {
      setIsOpen(false);

      const response = await strapiClient.request<{
        message: string;
      }>('post', `accounts/${account.documentId}/drop`);

      await refetchUser();
      if (onSuccess) {
        await onSuccess();
      }
      return response;
    },
    onSuccess: (data) => {
      if (isNexusAccount) {
        Utils.ForceCloseAllClients();
      }
      toast.success(data.message || 'Account dropped successfully');
    },
    onError: (error: any) => {
      toast.error(error.error?.message || 'Failed to drop account');
    },
  });

  // Determine if button should be disabled
  const isDisabled = isPending || account.user?.documentId !== user?.documentId;

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
              Your client will be logged out and the league will close.
            </p>
          </div>
        )}

        <DialogFooter className="flex gap-3 sm:justify-end">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            loading={isPending}
            disabled={isDisabled}
            onClick={() => handleDropAccount()}
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
