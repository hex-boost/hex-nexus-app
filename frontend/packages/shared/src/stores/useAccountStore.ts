// src/store/nexusAccountStore.ts
import { create } from 'zustand';

type useAccountStoreReturn = {
  isNexusAccount: boolean;

  setIsNexusAccount: (value: boolean) => void;
};

export const useAccountStore = create<useAccountStoreReturn>(set => ({
  isNexusAccount: false,
  setIsNexusAccount: (value: boolean) => {
    set({ isNexusAccount: value });
    console.log('isNexusAcountUpdated', value);
  },
}));
