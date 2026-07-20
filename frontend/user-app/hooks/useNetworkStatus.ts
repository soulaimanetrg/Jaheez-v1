import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { backendJson } from '../lib/backendApi';

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsOnline(navigator.onLine);
      const onOnline  = () => setIsOnline(true);
      const onOffline = () => setIsOnline(false);
      window.addEventListener('online',  onOnline);
      window.addEventListener('offline', onOffline);
      return () => {
        window.removeEventListener('online',  onOnline);
        window.removeEventListener('offline', onOffline);
      };
    } else {
      const check = async () => {
        try {
          await backendJson('/admin-api/health');
          setIsOnline(true);
        } catch {
          setIsOnline(false);
        }
      };
      check();
      const id = setInterval(check, 10000);
      return () => clearInterval(id);
    }
  }, []);

  return isOnline;
}
