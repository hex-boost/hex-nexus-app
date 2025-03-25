import type { UserType } from '@/types/types';
import { create } from 'zustand';

type AuthState = {
  user: null | UserType;
  jwt: string | null;
  login: (user: any, jwt: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
};

export const useUserStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  jwt: localStorage.getItem('authToken') || '',
  login: (user: UserType, jwt: string) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('authToken', jwt);

    set({ user, jwt });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    set({ user: null });
  },

  isAuthenticated: () => get().user !== null,

}));
