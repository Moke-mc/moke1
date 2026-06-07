import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'teacher' | 'parent';
  name: string;
}

interface Store {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'edu-system-storage',
    }
  )
);
