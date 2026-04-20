'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Building2, Power, Users, Edit2, X, Upload } from 'lucide-react';
import { createInstitution, toggleInstitutionStatus, updateInstitution } from '@/actions/institutions';
import styles from './Institutions.module.css';

interface Institution {
  id: string;
  name: string;
  logo?: string | null;
  isActive: boolean;
  createdAt: Date;
  _count: {
    users: number;
    students: number;
  };
}

export default function InstitutionsClient({ initialData }: { initialData: Institution[] }) {
  const [institutions, setInstitutions] = useState(initialData);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  
  // Edit State
  const [editingInst, setEditingInst] = useState<Institution | null>(null);
  const [editName, setEditName] = useState('');
  const [editLogo, setEditLogo] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    const result = await createInstitution({ name: newName });
    if (result.success) {
      setNewName('');
      setShowAdd(false);
      window.location.reload(); 
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  const handleToggle = async (id: string, currentStatus: boolean) => {
    if (!confirm('Kurum durumunu değiştirmek istediğinize emin misiniz?')) return;
    
    const result = await toggleInstitutionStatus(id, currentStatus);
    if (result.success) {
      setInstitutions(prev => prev.map(inst => 
        inst.id === id ? { ...inst, isActive: !currentStatus } : inst
      ));
    }
  };

  const openEdit = (inst: Institution) => {
    setEditingInst(inst);
    setEditName(inst.name);
    setEditLogo(inst.logo || null);
  };

  const closeEdit = () => {
    setEditingInst(null);
    setEditName('');
    setEditLogo(null);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo boyutu 2MB\'dan küçük olmalıdır.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInst || !editName.trim()) return;

    setLoading(true);
    const result = await updateInstitution(editingInst.id, {
      name: editName,
      logo: editLogo as string | null
    });

    if (result.success) {
      setInstitutions(prev => prev.map(inst => 
        inst.id === editingInst.id ? { ...inst, name: editName, logo: editLogo } : inst
      ));
      closeEdit();
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>Kurum Yönetimi</h1>
          <p className={styles.subtitle}>Sistemdeki tüm kayıtlı kurumları yönetin</p>
        </div>
        <Button onClick={() => setShowAdd(!showAdd)}>
          <Plus size={20} />
          <span>Yeni Kurum Ekle</span>
        </Button>
      </header>

      {showAdd && (
        <Card className={styles.addCard}>
          <CardHeader>Yeni Kurum Kaydı</CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className={styles.addForm}>
              <Input 
                placeholder="Kurum Adı (Örn: Özel Huzur Erkek Yurdu)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
              />
              <Button type="submit" disabled={loading}>
                {loading ? 'Kaydediliyor...' : 'Kurumu Kaydet'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal / Backdrop */}
      {editingInst && (
        <div className={styles.modalBackdrop}>
          <Card className={styles.modalCard}>
            <div className={styles.modalHeader}>
              <h3>Kurum Düzenle</h3>
              <button className={styles.closeBtn} onClick={closeEdit}><X size={20}/></button>
            </div>
            <CardContent>
              <form onSubmit={handleUpdate} className={styles.editForm}>
                <div className={styles.formGroup}>
                  <label>Kurum Adı</label>
                  <Input 
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Kurum Logosu</label>
                  <div className={styles.logoUploadArea}>
                    {editLogo ? (
                      <div className={styles.logoPreviewWrapper}>
                        <img src={editLogo} alt="Logo Preview" className={styles.logoPreview} />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className={styles.removeLogoBtn}
                          onClick={() => setEditLogo(null)}
                        >
                          <X size={14} /> Logo Kaldır
                        </Button>
                      </div>
                    ) : (
                      <div 
                        className={styles.uploadPlaceholder}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload size={32} />
                        <span>Logo Yükle (SVG, PNG, JPG)</span>
                        <p>Max: 2MB</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleLogoUpload} 
                      accept="image/*" 
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>

                <div className={styles.modalActions}>
                  <Button type="button" variant="ghost" onClick={closeEdit}>İptal</Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Güncelleniyor...' : 'Değişiklikleri Kaydet'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      <div className={styles.grid}>
        {institutions.map(inst => (
          <Card key={inst.id} className={!inst.isActive ? styles.inactiveCard : ''}>
            <CardContent className={styles.instCardContent}>
              <div className={styles.instHeader}>
                <div className={styles.logoSection}>
                  {inst.logo ? (
                    <img src={inst.logo} alt={inst.name} className={styles.instLogo} />
                  ) : (
                    <div className={styles.iconBox}>
                      <Building2 size={24} />
                    </div>
                  )}
                </div>
                <div className={styles.instMainInfo}>
                  <h3>{inst.name}</h3>
                  <span className={inst.isActive ? styles.badgeActive : styles.badgeInactive}>
                    {inst.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
              </div>

              <div className={styles.stats}>
                <div className={styles.statItem}>
                  <Users size={16} />
                  <span>{inst._count.users} Kullanıcı</span>
                </div>
                <div className={styles.statItem}>
                  <Plus size={16} />
                  <span>{inst._count.students} Öğrenci</span>
                </div>
              </div>

              <div className={styles.actions}>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openEdit(inst)}
                >
                  <Edit2 size={14} />
                  <span>Düzenle</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleToggle(inst.id, inst.isActive)}
                  className={inst.isActive ? styles.deactivateBtn : styles.activateBtn}
                >
                  <Power size={14} />
                  <span>{inst.isActive ? 'Durum Değiştir' : 'Aktif Et'}</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
