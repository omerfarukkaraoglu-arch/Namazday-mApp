'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { saveSetting, toggleSettingStatus, deleteSetting } from '@/actions/settings';
import styles from '../Yonetim.module.css';
import { Plus, Edit, Power, PowerOff, CheckSquare, Square, Trash2 } from 'lucide-react';

const DAYS = [
  { label: 'Pazartesi', value: '1' },
  { label: 'Salı', value: '2' },
  { label: 'Çarşamba', value: '3' },
  { label: 'Perşembe', value: '4' },
  { label: 'Cuma', value: '5' },
  { label: 'Cumartesi', value: '6' },
  { label: 'Pazar', value: '0' },
];

export function PrayerTimeSettingsClient({ 
  data,
  classes 
}: { 
  data: any[];
  classes: any[];
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sortOrder: 0,
    isActive: true,
    activeDays: '1,2,3,4,5,6,0',
    excludedClassIds: [] as string[]
  });

  const openModal = (item: any = null) => {
    if (item) {
      setEditItem(item);
      setFormData({
        name: item.name,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
        activeDays: item.activeDays || '1,2,3,4,5,6,0',
        excludedClassIds: item.excludedClasses?.map((c: any) => c.id) || []
      });
    } else {
      setEditItem(null);
      setFormData({
        name: '',
        sortOrder: data.length + 1,
        isActive: true,
        activeDays: '1,2,3,4,5,6,0',
        excludedClassIds: []
      });
    }
    setIsModalOpen(true);
  };

  const toggleDay = (day: string) => {
    const current = formData.activeDays.split(',').filter(d => d !== '');
    let next;
    if (current.includes(day)) {
      next = current.filter(d => d !== day);
    } else {
      next = [...current, day];
    }
    setFormData({ ...formData, activeDays: next.join(',') });
  };

  const toggleClassExemption = (classId: string) => {
    setFormData(prev => ({
      ...prev,
      excludedClassIds: prev.excludedClassIds.includes(classId)
        ? prev.excludedClassIds.filter(id => id !== classId)
        : [...prev.excludedClassIds, classId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await saveSetting('prayerTime', {
      id: editItem?.id,
      ...formData
    });

    if (result.error) {
      alert(result.error);
    } else {
      setIsModalOpen(false);
    }
    setLoading(false);
  };

  const handleToggleStatus = async (id: string, status: boolean) => {
    if (confirm(`Bu vakti ${status ? 'pasif' : 'aktif'} yapmak istediğinize emin misiniz?`)) {
      const res = await toggleSettingStatus('prayerTime', id, status);
      if (res.error) alert(res.error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`'${name}' vaktini TAMAMEN silmek istediğinize emin misiniz?`)) {
      const res = await deleteSetting('prayerTime', id);
      if (res.error) alert(res.error);
    }
  };

  const getDayLabels = (days: string) => {
    if (days === '1,2,3,4,5,6,0') return 'Her Gün';
    const dayArray = days.split(',');
    if (dayArray.length === 0 || days === '') return 'Kapalı';
    return DAYS.filter(d => dayArray.includes(d.value)).map(d => d.label.substring(0, 3)).join(', ');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Yoklama Vakitleri</h1>
          <p className={styles.description}>Namaz vakitlerini, muaf sınıfları ve aktif günleri yönetin.</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus size={18} /> Yeni Vakit Ekle
        </Button>
      </header>

      <Card>
        <CardContent style={{ padding: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader style={{ width: '80px' }}>Sıra</TableHeader>
                <TableHeader>Vakit İsmi</TableHeader>
                <TableHeader>Aktif Günler</TableHeader>
                <TableHeader>Muaf Sınıflar</TableHeader>
                <TableHeader>Durum</TableHeader>
                <TableHeader style={{ textAlign: 'right' }}>İşlemler</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(item => (
                <TableRow key={item.id} className={item.isActive ? styles.activeRow : styles.passiveRow}>
                  <TableCell><strong>{item.sortOrder}</strong></TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell style={{ fontSize: '0.8rem' }}>{getDayLabels(item.activeDays)}</TableCell>
                  <TableCell>
                    {item.excludedClasses?.length > 0 ? (
                      <span title={item.excludedClasses.map((c: any) => c.name).join(', ')}>
                        {item.excludedClasses.length} Sınıf Muaf
                      </span>
                    ) : (
                      <span style={{ opacity: 0.5 }}>-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.isActive ? 'success' : 'danger'}>
                      {item.isActive ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className={styles.actionButtons}>
                      <Button variant="secondary" size="sm" onClick={() => openModal(item)}>
                        <Edit size={16} />
                      </Button>
                      <Button 
                        variant={item.isActive ? 'danger' : 'success'} 
                        size="sm" 
                        onClick={() => handleToggleStatus(item.id, item.isActive)}
                      >
                        {item.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDelete(item.id, item.name)}
                        title="Tamamen Sil"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editItem ? "Vakti Düzenle" : "Yeni Vakit Oluştur"}
      >
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <Input 
              label="Vakit İsmi" 
              required 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
            />
            <Input 
              type="number"
              label="Sıra" 
              required 
              value={formData.sortOrder} 
              onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value)})} 
            />
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Yoklama Alınacak Günler</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', backgroundColor: 'var(--surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              {DAYS.map(day => (
                <label key={day.value} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.activeDays.split(',').includes(day.value)} 
                    onChange={() => toggleDay(day.value)}
                    style={{ display: 'none' }}
                  />
                  {formData.activeDays.split(',').includes(day.value) ? <CheckSquare size={18} color="var(--primary)" /> : <Square size={18} />}
                  {day.label}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1rem' }}>
            <label style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem', display: 'block' }}>Yoklamadan Muaf Sınıflar</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem', backgroundColor: 'var(--surface-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', maxHeight: '150px', overflowY: 'auto' }}>
              {classes.map(cls => (
                <label key={cls.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.excludedClassIds.includes(cls.id)} 
                    onChange={() => toggleClassExemption(cls.id)}
                    style={{ display: 'none' }}
                  />
                  {formData.excludedClassIds.includes(cls.id) ? <CheckSquare size={18} color="var(--danger)" /> : <Square size={18} />}
                  {cls.name}
                </label>
              ))}
              {classes.length === 0 && <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Önce sınıf eklemelisiniz.</span>}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>İşaretli sınıflar bu vakitte listede gözükmeyecektir.</p>
          </div>
        
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>İptal</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
