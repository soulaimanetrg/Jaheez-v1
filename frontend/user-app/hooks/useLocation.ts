import { useState } from 'react';
import * as Location from 'expo-location';

export function useLocation() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return false;
      }
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to request permission');
      return false;
    }
  };

  const getCurrentPositionAsync = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
         setIsLoading(false);
         return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const newCoords = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
      };

      setCoords(newCoords);
      return newCoords;
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    coords,
    error,
    isLoading,
    requestPermission,
    getCurrentPositionAsync,
  };
}
