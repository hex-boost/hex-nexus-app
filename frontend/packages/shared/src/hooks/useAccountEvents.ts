import type { AccountType } from '@/types/types.ts';
import { useAccountStore } from '@/stores/useAccountStore.ts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { useEventListener } from './useEventListener';

export function useAccountEvents() {
  const queryClient = useQueryClient();
  const { setIsNexusAccount } = useAccountStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingAccountsRef = useRef<Set<string>>(new Set());

  // Handle Nexus account state
  useEventListener<boolean>('nexusAccount:state', (isNexusAccount) => {
    setIsNexusAccount(isNexusAccount);
  });

  // Handler for account state changes with debouncing
  const handleAccountStateChange = useCallback((account: AccountType) => {
    if (!account) {
      console.error('account:state:changed event data is null or undefined');
      return;
    }

    const processingAccounts = processingAccountsRef.current;

    // Prevent handling duplicated events for the same account
    if (processingAccounts.has(account.documentId)) {
      console.log(`Already processing updates for ${account.documentId}, skipping`);
      return;
    }

    // Mark this account as being processed
    processingAccounts.add(account.documentId);

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    queryClient.setQueryData(['accounts', 'rented'], (oldData: any) => {
      if (!oldData) {
        return oldData;
      }

      return oldData.map((oldAccount: AccountType) => {
        if (oldAccount.documentId === account.documentId) {
          return {
            ...oldAccount,
            blueEssence: account.blueEssence,
            LCUskins: account.LCUskins,
            LCUchampions: account.LCUchampions,
            rankings: account.rankings,
            riotPoints: account.riotPoints,
          };
        }
        return oldAccount;
      });
    });

    // Schedule a full refresh after a delay
    console.log(`Waiting for 1 second to refresh queries for ${account.documentId}`);
    timeoutRef.current = setTimeout(() => {
      queryClient.refetchQueries({ queryKey: ['accounts', 'rented'] });
      console.log(`Queries refreshed for ${account.documentId}`);
      // Remove from processing set after refresh
      processingAccounts.delete(account.documentId);
    }, 1000);
  }, [queryClient, setIsNexusAccount]);

  useEventListener<AccountType>('account:state:changed', handleAccountStateChange);

  // Cleanup function to be called when needed
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    processingAccountsRef.current.clear();
  }, []);

  return { cleanup };
}
