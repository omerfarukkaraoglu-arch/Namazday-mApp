'use server';

import { prisma } from '@/lib/db';
import { getUserContext } from '@/lib/auth-server';
import webpush from 'web-push';

// VAPID keys should be set in environment variables
const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const privateKey = process.env.VAPID_PRIVATE_KEY!;
const mailto = process.env.VAPID_MAILTO || 'mailto:admin@namazdayim.app';

if (publicKey && privateKey) {
  webpush.setVapidDetails(mailto, publicKey, privateKey);
}

export async function subscribeUser(subscription: any) {
  const user = await getUserContext();
  if (!user) return { error: 'Oturum açmanız gerekiyor' };

  try {
    const { endpoint, keys } = subscription;
    
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: {
        userId: user.id,
        p256dh: keys.p256dh,
        auth: keys.auth
      },
      create: {
        userId: user.id,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth
      }
    });

    return { success: true };
  } catch (error) {
    console.error('Subscribe error:', error);
    return { error: 'Abonelik kaydedilemedi' };
  }
}

export async function unsubscribeUser(endpoint: string) {
  try {
    await prisma.pushSubscription.delete({
      where: { endpoint }
    });
    return { success: true };
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return { error: 'Abonelik kaldırılamadı' };
  }
}

export async function sendPushNotification(userId: string, payload: {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
}) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { userId }
  });

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth
            }
          },
          JSON.stringify(payload)
        );
      } catch (error: any) {
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Subscription expired or invalid, delete it
          await prisma.pushSubscription.delete({ where: { id: sub.id } });
        }
        throw error;
      }
    })
  );

  return results;
}
