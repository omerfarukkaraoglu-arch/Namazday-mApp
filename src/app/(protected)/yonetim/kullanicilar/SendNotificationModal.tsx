'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { sendNotification, broadcastToInstitution } from '@/actions/notifications';
import { BellRing, Send } from 'lucide-react';

interface SendNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: { id: string, displayName: string } | null;
  isBroadcast?: boolean;
}

export function SendNotificationModal({ isOpen, onClose, targetUser, isBroadcast }: SendNotificationModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: 'INFO' as 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isBroadcast) {
        result = await broadcastToInstitution(formData);
      } else if (targetUser) {
        result = await sendNotification({
          userId: targetUser.id,
          ...formData
        });
      }

      if (result?.error) {
        alert(result.error);
      } else {
        alert('Bildirim başarıyla gönderildi');
        setFormData({ title: '', message: '', type: 'INFO' });
        onClose();
      }
    } catch (error) {
      console.error('Submit notification error:', error);
      alert('Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={isBroadcast ? "Kurum Geneli Bildirim Gönder" : `${targetUser?.displayName} Kullanıcısına Bildirim Gönder`}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <Input 
          label="Başlık" 
          placeholder="Örn: Önemli Duyuru" 
          required 
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Mesaj</label>
          <textarea 
            required
            rows={4}
            placeholder="Bildirim mesajınızı buraya yazın..."
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              borderRadius: '8px', 
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              fontSize: '0.875rem'
            }}
            value={formData.message}
            onChange={e => setFormData({ ...formData, message: e.target.value })}
          />
        </div>

        <Select 
          label="Bildirim Tipi" 
          value={formData.type}
          onChange={e => setFormData({ ...formData, type: e.target.value as any })}
        >
          <option value="INFO">Bilgi (Mavi)</option>
          <option value="SUCCESS">Başarı (Yeşil)</option>
          <option value="WARNING">Uyarı (Turuncu)</option>
          <option value="ALERT">Kritik (Kırmızı)</option>
        </Select>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Button type="button" variant="secondary" onClick={onClose}>İptal</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Gönderiliyor...' : (
              <>
                <Send size={18} style={{ marginRight: '8px' }} />
                Gönder
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
