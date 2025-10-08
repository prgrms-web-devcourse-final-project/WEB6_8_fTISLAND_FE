import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ProfileType } from '@/routes/login/_hooks/useLogin';

export type AuthState = {
  userId?: number;
  email?: string;
  name?: string;
  currentActiveProfileType?: ProfileType;
  currentActiveProfileId?: number;
  isOnboardingCompleted?: boolean;
  availableProfiles?: ProfileType[];
  accessToken?: string;
  refreshToken?: string;
  setAuth: (payload: Partial<AuthState>) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      setAuth: (payload) => set((prev) => ({ ...prev, ...payload })),
      clear: () => set({}),
    }),
    {
      name: 'auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        userId: state.userId,
        email: state.email,
        name: state.name,
        currentActiveProfileType: state.currentActiveProfileType,
        currentActiveProfileId: state.currentActiveProfileId,
        isOnboardingCompleted: state.isOnboardingCompleted,
        availableProfiles: state.availableProfiles,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
