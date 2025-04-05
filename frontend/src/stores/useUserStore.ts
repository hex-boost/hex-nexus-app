import type { UserType } from '@/types/types';
import { BaseRepository } from '@repository';
import { create } from 'zustand';

type AuthState = {
  user: UserType | null;
  setUser: (user: UserType) => void;
  jwt: string | null;
  login: (user: any, jwt: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
  setAuthToken: (jwt: string) => void;
};
const getUserFromStorage = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return null;
  }
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Erro ao processar dados do usuário do localStorage', e);
    return null;
  }
};
const storedJWT = localStorage.getItem('authToken') || null;
// Set it in BaseRepository immediately
if (storedJWT) {
  BaseRepository.SetJWT(storedJWT);
} else {
  BaseRepository.ClearJWT();
}
export const useUserStore = create<AuthState>((set, get) => ({
  user: getUserFromStorage(),
  jwt: storedJWT,
  setUser: (user: UserType) => {
    set({ user });
    localStorage.setItem('user', JSON.stringify(user));
  },
  setAuthToken: (jwt: string) => {
    set({ jwt });
  },
  login: (user: UserType, jwt: string) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('authToken', jwt);
    BaseRepository.SetJWT(jwt);

    set({ user, jwt });
  },

  logout: () => {
    localStorage.clear();
    BaseRepository.ClearJWT();

    set({ user: null, jwt: '' });
  },

  isAuthenticated: () => get().user != null,
}));
