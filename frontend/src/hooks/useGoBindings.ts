import { useAccountStore } from '@/stores/useAccountStore.ts';
import { Utils } from '@utils';
import { Events } from '@wailsio/runtime';
import { useEffect } from 'react';

export function useGoState() {
  const { setIsNexusAccount } = useAccountStore();
  useEffect(() => {
    const cancel = Events.On('nexusAccount:state', (event) => {
      console.log('nexusAccount:state', event);
      setIsNexusAccount(event.data[0]);
    });
    return () => {
      cancel();
    };
  });
  return {
    Utils,
  };
}
