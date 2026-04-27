'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount } from '@/actions/notifications';
import styles from './Notifications.module.css';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pushPermission, setPushPermission] = useState<string>('default');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    const data = await getNotifications();
    setNotifications(data);
    const count = await getUnreadCount();
    setUnreadCount(count);
    setLoading(false);
  };

  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
    
    fetchNotifications();
    // Refresh notifications every 2 minutes
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAsRead = async (id: string) => {
    const result = await markAsRead(id);
    if (result.success) {
      setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead();
    if (result.success) {
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const handleEnablePush = async () => {
    try {
      const { enablePushNotifications } = await import('@/lib/push-client');
      const res = await enablePushNotifications();
      if (res.success) {
        setPushPermission('granted');
      } else {
        alert('Bildirim izni alınamadı veya desteklenmiyor: ' + res.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle size={18} />;
      case 'WARNING': return <AlertTriangle size={18} />;
      case 'ALERT': return <XCircle size={18} />;
      default: return <Info size={18} />;
    }
  };

  return (
    <div className={styles.notificationWrapper}>
      <button 
        className={styles.bellBtn} 
        onClick={() => setIsOpen(!isOpen)}
        title="Bildirimler"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className={styles.badge}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <div className={styles.dropdown} ref={dropdownRef}>
            <div className={styles.header}>
              <h3>Bildirimler</h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {pushPermission !== 'granted' && (
                  <button 
                    className={styles.markAllBtn} 
                    onClick={handleEnablePush}
                    style={{ color: 'var(--blue)', background: 'rgba(52, 152, 219, 0.1)' }}
                  >
                    Bildirimleri Aç
                  </button>
                )}
                {unreadCount > 0 && (
                  <button className={styles.markAllBtn} onClick={handleMarkAllAsRead}>
                    Tümünü okundu işaretle
                  </button>
                )}
              </div>
            </div>
            
            <div className={styles.list}>
              {notifications.length === 0 ? (
                <div className={styles.empty}>Henüz bildiriminiz yok.</div>
              ) : (
                notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`${styles.notificationItem} ${!notification.isRead ? styles.unread : ''}`}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification.id)}
                  >
                    {!notification.isRead && <div className={styles.unreadDot} />}
                    <div className={`${styles.typeIcon} ${styles[(notification.type || 'INFO').toLowerCase()]}`}>
                      {getIcon(notification.type)}
                    </div>
                    <div className={styles.itemContent}>
                      <div className={styles.itemHeader}>
                        <h4 className={styles.itemTitle}>{notification.title}</h4>
                        <span className={styles.itemTime}>
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })}
                        </span>
                      </div>
                      <p className={styles.itemMessage}>{notification.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
