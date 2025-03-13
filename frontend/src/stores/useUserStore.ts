import { create } from 'zustand'

interface AuthState {
  user: null | any
  jwt: string | null
  login: (user: any, jwt: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useUserStore = create<AuthState>((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  jwt: localStorage.getItem('jwt') || '',
  login: (user, jwt: string) => {
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, jwt })
  },

  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('authToken')
    set({ user: null })
  },

  isAuthenticated: () => get().user !== null,

}))
