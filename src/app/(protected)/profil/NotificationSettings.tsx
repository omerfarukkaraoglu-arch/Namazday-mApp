'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { enablePushNotifications } from '@/lib/push-client';
import { unsubscribeUser } from '@/actions/push';

export function NotificationSettings() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch (err) {
        console.error(err);
      }
    }
    setLoading(false);
  };

  const togglePush = async () => {
    setLoading(true);
    try {
      if (isSubscribed) {
        // Kapat (Unsubscribe)
        const registration = await navigator.serviceWorker.ready;
        const sub = await registration.pushManager.getSubscription();
        if (sub) {
          await unsubscribeUser(sub.endpoint);
          await sub.unsubscribe();
        }
        setIsSubscribed(false);
      } else {
        // Aç (Subscribe)
        const res = await enablePushNotifications();
        if (res.success) {
          setIsSubscribed(true);
        } else {
          alert('Bildirim izni alınamadı veya engellendi: ' + res.error);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ padding: '0.75rem', borderRadius: '50%', backgroundColor: isSubscribed ? 'rgba(39, 174, 96, 0.1)' : 'rgba(231, 76, 60, 0.1)', color: isSubscribed ? 'var(--success)' : 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isSubscribed ? <Bell size={20} /> : <BellOff size={20} />}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text)' }}>Cihaz Bildirimleri</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {isSubscribed ? 'Bu cihazda bildirimler açık' : 'Bu cihaz için kapalı'}
          </div>
        </div>
      </div>
      
      <button 
        onClick={togglePush} 
        disabled={loading}
        style={{ 
          padding: '0.5rem 1rem', 
          borderRadius: 'var(--radius-md)', 
          fontWeight: 600, 
          cursor: loading ? 'not-allowed' : 'pointer',
          background: isSubscribed ? 'rgba(231, 76, 60, 0.1)' : 'rgba(52, 152, 219, 0.1)',
          color: isSubscribed ? 'var(--danger)' : 'var(--blue)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          opacity: loading ? 0.7 : 1
        }}
      >
        {loading ? 'Bekleniyor...' : (isSubscribed ? 'Kapat' : 'Aç')}
      </button>
    </div>
  );
}
