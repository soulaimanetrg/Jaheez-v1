import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { Driver } from '@/lib/api';

interface DriverState {
  driver: Driver | null;
  pendingPhone: string | null;
  isLoading: boolean;
  setDriver: (d: Driver | null) => void;
  setPendingPhone: (p: string | null) => void;
  setLoading: (l: boolean) => void;
  logout: () => void;
}

const driverStateStorage = {
  getItem: (name: string) => (
    Platform.OS === 'web' ? AsyncStorage.getItem(name) : SecureStore.getItemAsync(name)
  ),
  setItem: (name: string, value: string) => (
    Platform.OS === 'web' ? AsyncStorage.setItem(name, value) : SecureStore.setItemAsync(name, value)
  ),
  removeItem: (name: string) => (
    Platform.OS === 'web' ? AsyncStorage.removeItem(name) : SecureStore.deleteItemAsync(name)
  ),
};

export const useDriverStore = create<DriverState>()(
  persist(
    (set) => ({
      driver: null, pendingPhone: null, isLoading: false,
      setDriver: (driver) => set({ driver }),
      setPendingPhone: (pendingPhone) => set({ pendingPhone }),
      setLoading: (isLoading) => set({ isLoading }),
      logout: () => set({ driver: null, pendingPhone: null }),
    }),
    {
      name: 'jaheez-driver-state',
      storage: createJSONStorage(() => driverStateStorage),
      partialize: (s) => ({ driver: s.driver }),
    }
  )
);
