'use client';

import { useEffect } from 'react';
import { getUnreadCount } from '@/actions/notifications';

export function BadgeManager() {
  useEffect(() => {
    const updateBadge = async () => {
      try {
        const count = await getUnreadCount();
        
        if ('setAppBadge' in navigator) {
          if (count > 0) {
            // @ts-ignore
            await navigator.setAppBadge(count);
          } else {
            // @ts-ignore
            await navigator.clearAppBadge();
          }
        }
      } catch (error) {
        console.error('Badge update error:', error);
      }
    };

    updateBadge();
    
    // Her 2 dakikada bir güncelle (NotificationCenter ile uyumlu)
    const interval = setInterval(updateBadge, 120000);
    
    return () => {
      clearInterval(interval);
    };
  }, []);

  return null; // Görünmez bileşen
}
