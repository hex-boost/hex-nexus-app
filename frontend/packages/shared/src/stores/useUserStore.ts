import type { UserType } from '@/types/types';
import { BaseClient } from '@client';
import { LogService } from '@logger';
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
    const user = JSON.parse(userStr) as UserType;
    return user;
  } catch (e) {
    console.error('Erro ao processar dados do usuário do localStorage', e);
    return null;
  }
};
const logComponent = 'useUserStore';
// Set it in BaseRepository immediately
export const useUserStore = create<AuthState>((set, get) => ({
  user: getUserFromStorage(),
  jwt: localStorage.getItem('authToken') || null,
  setUser: (user: UserType) => {
    set({ user });
    localStorage.setItem('user', JSON.stringify(user));
  },
  setAuthToken: (jwt: string) => {
    set({ jwt });
    localStorage.setItem('authToken', jwt);
  },
  login: (user: UserType, jwt: string) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('authToken', jwt);
    BaseClient.SetJWT(jwt);

    // Set logger context
    if (user && user.id && user.username) {
      LogService.Info(logComponent, 'Setting user context for logging', {
        userId: user.id,
        username: user.username,
      });
      LogService.SetUserContext(String(user.id), user.username).catch(err =>
        LogService.Error(logComponent, 'Failed to set user context', { error: err }),
      );
    }

    set({ user, jwt });
  },

  logout: () => {
    LogService.Info(logComponent, 'User logging out. Clearing user context and local storage.', {});
    localStorage.clear();
    BaseClient.ClearJWT();

    // Clear LogService context
    LogService.ClearUserContext().catch(err => LogService.Error(logComponent, 'Failed to clear user context', { error: err }));
  },
  isAuthenticated: () => get().jwt != null,

}));
const initialUser = useUserStore.getState().user;
if (initialUser && initialUser.id && initialUser.username) {
  LogService.Info(logComponent, 'Setting initial user context from stored session', {
    userId: initialUser.id,
    username: initialUser.username,
  });
  LogService.SetUserContext(String(initialUser.id), initialUser.username).catch(err =>
    LogService.Error(logComponent, 'Failed to set initial user context', { error: err }),
  );
}
