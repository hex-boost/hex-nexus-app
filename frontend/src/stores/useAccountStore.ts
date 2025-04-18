// src/store/nexusAccountStore.ts
import { create } from 'zustand';

type useAccountStoreReturn = {
  isNexusAccount: boolean;

  setIsNexusAccount: (value: boolean) => void;
  syncWithBackend: () => Promise<void>;
};

export const useAccountStore = create<useAccountStoreReturn>(set => ({
  isNexusAccount: false,

  // Método para atualizar o estado no frontend e notificar o backend
  setIsNexusAccount: (value: boolean) => {
    set({ isNexusAccount: value });
    console.log('isNexusAcountUpdated', value);
  },
}));
