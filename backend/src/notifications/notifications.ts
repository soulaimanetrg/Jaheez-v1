import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { logger } from '../config/logger';
import { supabase } from '../db/supabase';
import { env } from '../config/env';

// Create a new Expo SDK client
const expo = new Expo();

export interface PushNotificationPayload {
  to: string; // Expo push token (ExponentPushToken[xxx])
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default' | null;
}

/**
 * Send a single push notification
 */
export async function sendPushNotification(payload: PushNotificationPayload): Promise<boolean> {
  if (env.OUTBOUND_INTEGRATIONS_DISABLED) {
    logger.info('Outbound push suppressed by environment safety control.');
    return false;
  }
  const { to, title, body, data, sound = 'default' } = payload;

  if (!Expo.isExpoPushToken(to)) {
    logger.error('Invalid Expo push token rejected');
    return false;
  }

  const message: ExpoPushMessage = {
    to,
    sound,
    title,
    body,
    data,
  };

  try {
    const chunks = expo.chunkPushNotifications([message]);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      tickets.push(...ticketChunk);
    }

    // Process tickets (log failures)
    for (const ticket of tickets) {
      if (ticket.status === 'error') {
        logger.error(`Error sending push notification: ${ticket.message}`);
        if (ticket.details && ticket.details.error) {
          logger.error(`Error code: ${ticket.details.error}`);
        }
        return false;
      }
    }

    logger.debug('Notification successfully sent');
    return true;
  } catch (error) {
    logger.error('Failed to send push notification:', error);
    return false;
  }
}

/**
 * Send push notifications in batch
 */
export async function sendBatchPushNotifications(payloads: PushNotificationPayload[]): Promise<number> {
  const validMessages: ExpoPushMessage[] = [];

  for (const p of payloads) {
    if (Expo.isExpoPushToken(p.to)) {
      validMessages.push({
        to: p.to,
        sound: p.sound || 'default',
        title: p.title,
        body: p.body,
        data: p.data,
      });
    } else {
      logger.warn(`Skipping invalid push token: ${p.to}`);
    }
  }

  if (validMessages.length === 0) return 0;

  try {
    const chunks = expo.chunkPushNotifications(validMessages);
    let successCount = 0;

    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      for (const ticket of tickets) {
        if (ticket.status === 'ok') {
          successCount++;
        } else {
          logger.error(`Batch send error: ${ticket.message}`);
        }
      }
    }

    return successCount;
  } catch (error) {
    logger.error('Batch notification failed:', error);
    return 0;
  }
}

/**
 * Send push notification to user based on order status change
 */
export async function sendPushToUser(userId: string, status: string, orderId: string): Promise<void> {
  const STATUS_LABELS: Record<string, { title: string; body: string }> = {
    pending: { title: 'جاهز 📦', body: 'تم استلام طلبك بنجاح' },
    confirmed: { title: 'جاهز ✅', body: 'تم تأكيد طلبك' },
    preparing: { title: 'جاهز 🍳', body: 'المتجر يحضر طلبك الآن' },
    picked_up: { title: 'جاهز 🛵', body: 'السائق في طريقه إليك' },
    delivered: { title: 'جاهز 🎉', body: 'وصل طلبك! استمتع بوجبتك' },
    completed: { title: 'جاهز ⭐', body: 'اكتمل طلبك. شاركنا رأيك' },
    cancelled: { title: 'جاهز ❌', body: 'تم إلغاء طلبك' },
  };

  const label = STATUS_LABELS[status];
  if (!label) return;

  try {
    const { data: u, error } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', userId)
      .maybeSingle();

    if (error || !u?.push_token) return;

    await sendPushNotification({
      to: u.push_token,
      title: label.title,
      body: label.body,
      data: { orderId },
    });
  } catch (err: any) {
    logger.error('[push] Error sending status push to user:', err.message);
  }
}

/**
 * Send custom push notification to driver
 */
export async function sendPushToDriver(driverId: string, title: string, body: string, orderId: string): Promise<void> {
  try {
    const { data: drv, error: drvErr } = await supabase
      .from('drivers')
      .select('user_id')
      .eq('id', driverId)
      .maybeSingle();

    if (drvErr || !drv?.user_id) return;

    const { data: u, error: uErr } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', drv.user_id)
      .maybeSingle();

    if (uErr || !u?.push_token) return;

    await sendPushNotification({
      to: u.push_token,
      title,
      body,
      data: { orderId },
    });
  } catch (err: any) {
    logger.error('[push] Error sending push to driver:', err.message);
  }
}
