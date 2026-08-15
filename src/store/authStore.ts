import {create} from 'zustand';
import {User, Hub} from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedHub: Hub | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setHub: (hub: Hub | null) => void;
  updateUser: (partial: Partial<User>) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  selectedHub: null,

  setUser: user =>
    set({user, isAuthenticated: !!user, isLoading: false}),

  setLoading: isLoading => set({isLoading}),

  setHub: selectedHub => set({selectedHub}),

  updateUser: partial => {
    const current = get().user;
    if (current) {
      set({user: {...current, ...partial}});
    }
  },

  reset: () =>
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      selectedHub: null,
    }),
}));
