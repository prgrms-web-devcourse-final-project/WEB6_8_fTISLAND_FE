import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type StoreDetails = {
  id?: number;
  name?: string;
  description?: string;
  roadAddr?: string;
  imageUrl?: string;
  category?: string;
  lat?: number;
  lng?: number;
};

type StoreDetailsState = {
  selectedStore?: StoreDetails | null;
  setSelectedStore: (details?: StoreDetails | null) => void;
  clear: () => void;
};

export const useStoreDetailsStore = create<StoreDetailsState>()(
  persist(
    (set) => ({
      setSelectedStore: (details) => set({ selectedStore: details ?? null }),
      clear: () => set({ selectedStore: null }),
    }),
    {
      name: 'store-details',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ selectedStore: state.selectedStore }),
    }
  )
);
