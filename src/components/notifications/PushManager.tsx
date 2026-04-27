'use client';

import { useEffect, useState } from 'react';
import { subscribeUser } from '@/actions/push';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushManager() {
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      registerServiceWorker();
    }
  }, []);

  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });
      
      // Wait for registration to be ready
      await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        requestPermission();
      }
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  }

  async function requestPermission() {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        subscribeToPush();
      }
    } catch (err) {
      console.error('Notification permission request failed:', err);
    }
  }

  async function subscribeToPush() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!publicKey) {
        console.error('VAPID public key is missing');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      console.log('Push Subscription object:', subscription);

      const res = await subscribeUser(JSON.parse(JSON.stringify(subscription)));
      if (res.success) {
        console.log('Push subscription successfully saved to database');
      } else {
        console.error('Failed to save subscription:', res.error);
      }
    } catch (err) {
      console.error('Push subscription failed error:', err);
    }
  }

  return null; // Görünmez bileşen
}
