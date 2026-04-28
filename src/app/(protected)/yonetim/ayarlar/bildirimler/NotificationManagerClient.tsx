'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { sendNotification, broadcastToInstitution } from '@/actions/notifications';
import { Send, Users, User } from 'lucide-react';
import styles from './Notifications.module.css';

interface NotificationManagerClientProps {
  users: { id: string; displayName: string; role: string }[];
  institutionId: string;
}

export function NotificationManagerClient({ users, institutionId }: NotificationManagerClientProps) {
  const [targetType, setTargetType] = useState<'ALL' | 'SPECIFIC'>('ALL');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      if (targetType === 'ALL') {
        const result = await broadcastToInstitution(institutionId, title, message);
        if (result.success) {
          setSuccessMsg('Bildirim tüm kullanıcılara başarıyla gönderildi.');
          setTitle('');
          setMessage('');
        } else {
          setErrorMsg(result.error || 'Bildirim gönderilemedi.');
        }
      } else {
        if (!selectedUserId) {
          setErrorMsg('Lütfen bir kullanıcı seçin.');
          setLoading(false);
          return;
        }
        const result = await sendNotification(selectedUserId, title, message);
        if (result.success) {
          setSuccessMsg('Bildirim başarıyla gönderildi.');
          setTitle('');
          setMessage('');
        } else {
          setErrorMsg(result.error || 'Bildirim gönderilemedi.');
        }
      }
    } catch (err) {
      setErrorMsg('Bir hata oluştu.');
    }
    setLoading(false);
  };

  return (
    <div className={styles.grid}>
      <Card className={styles.mainCard}>
        <CardHeader>Yeni Bildirim Gönder</CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.targetSelector}>
              <div 
                className={`${styles.targetOption} ${targetType === 'ALL' ? styles.active : ''}`}
                onClick={() => setTargetType('ALL')}
              >
                <Users size={24} />
                <span>Tüm Kurum</span>
              </div>
              <div 
                className={`${styles.targetOption} ${targetType === 'SPECIFIC' ? styles.active : ''}`}
                onClick={() => setTargetType('SPECIFIC')}
              >
                <User size={24} />
                <span>Belirli Kullanıcı</span>
              </div>
            </div>

            {targetType === 'SPECIFIC' && (
              <div className={styles.formGroup}>
                <label>Kullanıcı Seçin</label>
                <select 
                  value={selectedUserId} 
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className={styles.input}
                  required
                >
                  <option value="">Seçiniz...</option>
                  {users.map(u => (
                    <option key={u.id} value={u.id}>{u.displayName} ({u.role})</option>
                  ))}
                </select>
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Başlık</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className={styles.input}
                placeholder="Örn: Yeni Duyuru"
                required
                maxLength={50}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Mesaj İçeriği</label>
              <textarea 
                value={message} 
                onChange={(e) => setMessage(e.target.value)} 
                className={styles.textarea}
                placeholder="Bildirim detaylarını buraya yazın..."
                required
                rows={4}
                maxLength={200}
              />
            </div>

            {errorMsg && <div className={styles.error}>{errorMsg}</div>}
            {successMsg && <div className={styles.success}>{successMsg}</div>}

            <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
              <Send size={18} />
              {loading ? 'Gönderiliyor...' : 'Gönder'}
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className={styles.infoSidebar}>
        <Card>
          <CardHeader>Bilgi</CardHeader>
          <CardContent>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
              Gönderdiğiniz bildirimler, kullanıcıların hem uygulama içi bildirim paneline hem de (izin vermişlerse) cihazlarının kilit ekranına "Anlık Bildirim (Push)" olarak düşecektir.
            </p>
            <ul style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginTop: '1rem', paddingLeft: '1.2rem' }}>
              <li><strong>Tüm Kurum:</strong> Kurumunuzdaki yetkili hesaplara toplu duyuru yapmak için kullanın.</li>
              <li><strong>Belirli Kullanıcı:</strong> Sadece bir kişiye özel mesaj iletmek için kullanın.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
