import type { AccountType } from '@/types/types.ts';
import { useAccountStore } from '@/stores/useAccountStore.ts';
import { useQueryClient } from '@tanstack/react-query';
import { Events } from '@wailsio/runtime';
import { useEffect, useRef } from 'react';

export function useGoState() {
  const queryClient = useQueryClient();
  const { setIsNexusAccount } = useAccountStore();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingAccountsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Store a reference to the Set inside the effect
    const processingAccounts = processingAccountsRef.current;

    const cancel = Events.On('nexusAccount:state', (event) => {
      console.log('nexusAccount:state', event);
      setIsNexusAccount(event.data[0]);
    });

    const cancel2 = Events.On('account:state:changed', (event) => {
      if (!event.data[0]) {
        console.error('account:state:changed event data is null or undefined');
        return;
      }

      console.log('account:state:changed', event.data[0]);
      const account = event.data[0] as AccountType;

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
    });

    return () => {
      cancel();
      cancel2();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Use the local reference in cleanup
      processingAccounts.clear();
    };
  }, [queryClient, setIsNexusAccount]);
}
