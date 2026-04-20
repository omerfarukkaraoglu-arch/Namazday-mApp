'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { saveSetting, toggleSettingStatus, deleteSetting } from '@/actions/settings';
import styles from './Yonetim.module.css';
import { Plus, Edit, Power, PowerOff, Trash2 } from 'lucide-react';
import { Select } from '@/components/ui/Select';

export function GenericSettingsClient({ 
  title, 
  description, 
  type, 
  data 
}: { 
  title: string; 
  description: string; 
  type: 'class' | 'level' | 'prayerTime' | 'category'; 
  data: any[];
  categories?: any[];
}) {

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    sortOrder: 0,
    isActive: true,
    categoryId: ''
  });

  const openModal = (item: any = null) => {
    if (item) {
      setEditItem(item);
      setFormData({
        name: item.name,
        sortOrder: item.sortOrder,
        isActive: item.isActive,
        categoryId: item.categoryId || ''
      });
    } else {
      setEditItem(null);
      setFormData({
        name: '',
        sortOrder: data.length + 1,
        isActive: true,
        categoryId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await saveSetting(type, {
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

  const handleToggle = async (id: string, status: boolean) => {
    if (confirm(`Bu kaydı ${status ? 'pasif' : 'aktif'} yapmak istediğinize emin misiniz?`)) {
      const res = await toggleSettingStatus(type, id, status);
      if (res.error) alert(res.error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`'${name}' kaydını TAMAMEN silmek istediğinize emin misiniz?`)) {
      const res = await deleteSetting(type, id);
      if (res.error) alert(res.error);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus size={18} /> Yeni Ekle
        </Button>
      </header>

      <Card>
        <CardContent style={{ padding: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader style={{ width: '80px' }}>Sıra</TableHeader>
                <TableHeader>İsim</TableHeader>
                {(type === 'class' || type === 'level') && <TableHeader>Kategori</TableHeader>}
                <TableHeader>Durum</TableHeader>
                <TableHeader style={{ textAlign: 'right' }}>İşlemler</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(item => (
                <TableRow key={item.id} className={item.isActive ? styles.activeRow : styles.passiveRow}>
                  <TableCell><strong>{item.sortOrder}</strong></TableCell>
                  <TableCell>{item.name}</TableCell>
                  {(type === 'class' || type === 'level') && (
                    <TableCell>
                      <Badge variant="secondary">{item.category?.name || '-'}</Badge>
                    </TableCell>
                  )}
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
                        onClick={() => handleToggle(item.id, item.isActive)}
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
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} style={{ textAlign: 'center', padding: '2rem' }}>
                    Henüz kayıt bulunmuyor.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editItem ? "Kaydı Düzenle" : "Yeni Kayıt Oluştur"}
      >
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          <Input 
            label="İsim" 
            required 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          <Input 
            type="number"
            label="Sıralama (Listelerdeki Görünüm Sırası)" 
            required 
            value={formData.sortOrder} 
            onChange={e => setFormData({...formData, sortOrder: parseInt(e.target.value)})} 
          />
        
          {(type === 'class' || type === 'level') && categories && (
            <Select 
              label="Kategori / Statü (Opsiyonel)" 
              value={formData.categoryId} 
              onChange={e => setFormData({...formData, categoryId: e.target.value})}
            >
              <option value="">Seçilmedi</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </Select>
          )}
        
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>İptal</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
