import type { Rental } from '@/types/types.ts';
import { AccountCard } from '@/components/AccountCard.tsx';
import { Button } from '@/components/ui/button.tsx';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { motion } from 'framer-motion';
import { Gamepad2, ShoppingCart } from 'lucide-react';

// Simplified component for each account item
function AccountItem({ rental, onAccountChange }: { rental: Rental; onAccountChange: () => Promise<void> }) {
  const mostRecentAction = rental.currentExpirationDate;

  return (
    <AccountCard
      key={rental.id}
      gameType="lol"

      expirationDate={mostRecentAction}
      riotAccount={rental.riotAccount}
      onAccountChange={onAccountChange}
    />
  );
}

type CurrentlyRentedAccountsProps = {
  className?: string;
  accounts: Rental[];
};

export default function CurrentlyRentedAccounts({ accounts, className }: CurrentlyRentedAccountsProps) {
  const router = useRouter();

  const queryClient = useQueryClient();
  // Function to refresh accounts after dropping one
  const handleAccountChange = async () => {
    await queryClient.invalidateQueries({ queryKey: ['rentals'] });
    await queryClient.invalidateQueries({ queryKey: ['accounts'] });
  };

  return (
    <div className={cn('w-full px-6  max-h-[240px] flex h-full flex-col gap-4  overflow-y-auto', className)}>
      {accounts.length > 0
        ? accounts.map(rental => (
            <AccountItem
              key={rental.id}
              rental={rental}
              onAccountChange={handleAccountChange}
            />
          ))
        : (
            <div className="flex flex-col items-center justify-center text-center py-4 px-2 space-y-3 rounded-lg">
              <motion.div
                className="border rounded-2xl p-4 flex items-center justify-center h-20 w-20"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Gamepad2 className="h-12 w-12 text-muted-foreground" />
              </motion.div>

              <div className="space-y-2 max-w-md">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">No active accounts</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Rent an account to start playing.
                </p>
              </div>

              <Button
                onClick={() => router.navigate({ to: '/accounts' })}
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Browse Accounts
              </Button>
            </div>
          )}
    </div>
  );
}
