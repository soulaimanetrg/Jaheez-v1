import { create } from 'zustand';

export interface LocationState {
  coords: { lat: number; lng: number } | null;
  lastUpdated: number | null;
  setCoords: (coords: { lat: number; lng: number }) => void;
  clearCoords: () => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  coords: null,
  lastUpdated: null,
  setCoords: (coords) => set({ coords, lastUpdated: Date.now() }),
  clearCoords: () => set({ coords: null, lastUpdated: null }),
}));
