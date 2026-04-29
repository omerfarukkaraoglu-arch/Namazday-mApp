'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { getNotifications, markAsRead, markAllAsRead, getUnreadCount, deleteNotification, deleteAllNotifications } from '@/actions/notifications';
import styles from './Notifications.module.css';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
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

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Okundu olarak işaretlenmesini engelle
    const result = await deleteNotification(id);
    if (result.success) {
      setNotifications(notifications.filter(n => n.id !== id));
      // Eğer silinen bildirim okunmamışsa sayacı düşür
      const isUnread = notifications.find(n => n.id === id && !n.isRead);
      if (isUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Tüm bildirimleri silmek istediğinize emin misiniz?')) return;
    const result = await deleteAllNotifications();
    if (result.success) {
      setNotifications([]);
      setUnreadCount(0);
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
              <div className={styles.headerActions}>
                {unreadCount > 0 && (
                  <button className={styles.actionBtn} onClick={handleMarkAllAsRead} title="Tümünü okundu işaretle">
                    <Check size={16} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button className={styles.actionBtn} onClick={handleDeleteAll} title="Tümünü sil" style={{ color: 'var(--danger)' }}>
                    <Trash2 size={16} />
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
                    <button 
                      className={styles.deleteBtn} 
                      onClick={(e) => handleDelete(e, notification.id)}
                      title="Sil"
                    >
                      <Trash2 size={14} />
                    </button>
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
