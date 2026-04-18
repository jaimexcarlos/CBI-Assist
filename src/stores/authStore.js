import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      roomNumber: null,

      setAuth: (token, user, roomNumber = null) =>
        set({ token, user, roomNumber: roomNumber || user?.roomNumber || null }),

      clearAuth: () => set({ token: null, user: null, roomNumber: null }),
    }),
    { name: 'balai-assist-auth' }
  )
);
