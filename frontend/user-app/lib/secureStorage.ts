import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export const secureStorage = {
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

