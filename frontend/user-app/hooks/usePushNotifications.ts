import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import { backendJson } from '../lib/backendApi';
import { storeLocalNotif } from '../lib/notificationInbox';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Only import notifications if not in Expo Go (Push is removed from Expo Go in SDK 53+)
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
let Notifications: any = null;
try {
  if (!isExpoGo) {
    Notifications = require('expo-notifications');
  }
} catch {
  Notifications = null;
}

if (!isExpoGo && Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge:  true,
      shouldShowBanner: true,
      shouldShowList:  true,
    }),
  });
}

async function savePushToken(userId: string, token: string) {
  try {
    await backendJson('/admin-api/v1/customer/push-token', {
      method: 'PATCH',
      body: JSON.stringify({ push_token: token }),
    });
  } catch {
    // Push registration is best-effort; orders still load through backend polling and sockets.
  }
}

async function registerForPushNotifications(): Promise<string | null> {
  if (isExpoGo || !Notifications) return null;
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android' && Notifications) {
    await Notifications.setNotificationChannelAsync('orders', {
      name:             'طلباتي',
      importance:       Notifications.AndroidImportance?.MAX ?? 4,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:       '#F03030',
      sound:            'default',
    });
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    return token ?? null;
  } catch { return null; }
}

function notifTypeFromTitle(title: string): 'order' | 'system' | 'broadcast' {
  if (title.startsWith('جاهز')) return 'order';
  return 'system';
}

export function usePushNotifications() {
  const user           = useAuthStore(s => s.user);
  const notifListener  = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    if (isExpoGo || !Notifications || !user?.id || !user?.notification_enabled) return;

    registerForPushNotifications().then(token => {
      if (token && user.push_token !== token) {
        savePushToken(user.id, token);
      }
    });

    notifListener.current = Notifications.addNotificationReceivedListener((notification: any) => {
      const { title, body, data } = notification.request.content;
      if (!title || !body) return;
      storeLocalNotif({
        id:         notification.request.identifier,
        title:      title as string,
        body:       body as string,
        type:       notifTypeFromTitle(title as string),
        orderId:    (data as any)?.orderId ?? undefined,
        created_at: new Date().toISOString(),
      });
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const data = response.notification.request.content.data as any;
      if (data?.orderId) {
        router.push(`/(flows)/order/${data.orderId}` as any);
      }
    });

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.id, user?.notification_enabled]);
}
