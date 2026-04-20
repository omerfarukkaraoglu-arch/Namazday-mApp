'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { createOrUpdateUser, toggleUserStatus, deleteUser } from '@/actions/users';
import styles from '../Yonetim.module.css';
import { Plus, Edit, Power, PowerOff, Shield, User, Trash2, Building2 } from 'lucide-react';

export function UsersClient({ 
  users, 
  currentUserId,
  institutions = [],
  isSystemAdmin = false
}: { 
  users: any[], 
  currentUserId: string,
  institutions?: { id: string, name: string }[],
  isSystemAdmin?: boolean
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    password: '',
    role: 'YOKLAMACI',
    institutionId: ''
  });

  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (user: any = null) => {
    if (user) {
      setEditUser(user);
      setFormData({
        username: user.username,
        displayName: user.displayName,
        password: '',
        role: user.role,
        institutionId: user.institutionId || ''
      });
    } else {
      setEditUser(null);
      setFormData({
        username: '',
        displayName: '',
        password: '',
        role: 'YOKLAMACI',
        institutionId: institutions.length > 0 ? institutions[0].id : ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await createOrUpdateUser({
      id: editUser?.id,
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
    if (confirm(`Kullanıcıyı ${status ? 'pasif' : 'aktif'} yapmak istediğinize emin misiniz?`)) {
      const res = await toggleUserStatus(id, status);
      if (res.error) alert(res.error);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`'${name}' isimli kullanıcıyı TAMAMEN SİLMEK istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      const res = await deleteUser(id);
      if (res.error) alert(res.error);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Sistem Kullanıcıları</h1>
          <p className={styles.description}>Sisteme girebilecek öğretmenler ve yöneticilerin hesapları.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: '250px' }}>
            <Input 
              placeholder="İsim veya kullanıcı adı ara..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => openModal()}>
            <Plus size={18} /> Yeni Kullanıcı
          </Button>
        </div>
      </header>

      <Card>
        <CardContent style={{ padding: 0 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Kullanıcı Adı</TableHeader>
                <TableHeader>Görünür İsim</TableHeader>
                <TableHeader>Yetki</TableHeader>
                {isSystemAdmin && <TableHeader>Bağlı Kurum</TableHeader>}
                <TableHeader>Durum</TableHeader>
                <TableHeader style={{ textAlign: 'right' }}>İşlemler</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map(user => (
                  <TableRow key={user.id} className={user.isActive ? styles.activeRow : styles.passiveRow}>
                    <TableCell><strong>{user.username}</strong></TableCell>
                    <TableCell>{user.displayName}</TableCell>
                    <TableCell>
                      {user.role === 'SUPER_ADMIN' || user.role === 'admin' ? (
                        <Badge variant="info"><Shield size={12} style={{marginRight:4}} /> KURUM ADMİNİ</Badge>
                      ) : user.role === 'SYSTEM_ADMIN' ? (
                        <Badge variant="warning"><Shield size={12} style={{marginRight:4}} /> SİSTEM ADMİNİ</Badge>
                      ) : (
                        <Badge variant="neutral"><User size={12} style={{marginRight:4}} /> YOKLAMACI</Badge>
                      )}
                    </TableCell>
                    {isSystemAdmin && (
                      <TableCell>
                        <div className={styles.institutionCell}>
                          <Building2 size={14} className={styles.instIcon} />
                          <span>{user.institution?.name || 'Bilinmiyor'}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <Badge variant={user.isActive ? 'success' : 'danger'}>
                        {user.isActive ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className={styles.actionButtons}>
                        <Button variant="secondary" size="sm" onClick={() => openModal(user)}>
                          <Edit size={16} />
                        </Button>
                        <Button 
                          variant={user.isActive ? 'danger' : 'success'} 
                          size="sm" 
                          onClick={() => handleToggle(user.id, user.isActive)}
                          disabled={user.id === currentUserId}
                          title={user.id === currentUserId ? 'Kendinizi pasif yapamazsınız' : ''}
                        >
                          {user.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm" 
                          onClick={() => handleDelete(user.id, user.displayName)}
                          disabled={user.id === currentUserId}
                          title={user.id === currentUserId ? 'Kendinizi silemezsiniz' : 'Kullanıcıyı tamamen sil'}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isSystemAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    Aranan kriterlere uygun kullanıcı bulunamadı.
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
        title={editUser ? "Kullanıcı Düzenle" : "Yeni Kullanıcı Ekle"}
      >
        <form onSubmit={handleSubmit} className={styles.formGrid}>
          {isSystemAdmin && (
            <Select 
              label="Bağlı Olacağı Kurum" 
              required
              value={formData.institutionId} 
              onChange={e => setFormData({...formData, institutionId: e.target.value})}
            >
              {institutions.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </Select>
          )}

          <Input 
            label="Kullanıcı Adı (Giriş için kullanılacak)" 
            required 
            value={formData.username} 
            onChange={e => setFormData({...formData, username: e.target.value})} 
          />
          <Input 
            label="Görünür İsim (Örn: Ahmet Hoca)" 
            required 
            value={formData.displayName} 
            onChange={e => setFormData({...formData, displayName: e.target.value})} 
          />
          
          <Select 
            label="Hesap Yetkisi" 
            value={formData.role} 
            onChange={e => setFormData({...formData, role: e.target.value})}
          >
            <option value="YOKLAMACI">Normal Yoklamacı</option>
            <option value="admin">Kurum Admini</option>
            {isSystemAdmin && <option value="SYSTEM_ADMIN">Sistem Admini (Full Yetki)</option>}
          </Select>

          <div style={{ marginTop: '0.5rem' }}>
            <Input 
              type="password" 
              label="Şifre" 
              required={!editUser} 
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
            {editUser && <p className={styles.helpText}>Şifreyi değiştirmek istemiyorsanız boş bırakın.</p>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>İptal</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
