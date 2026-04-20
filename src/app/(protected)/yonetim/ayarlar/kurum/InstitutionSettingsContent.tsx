'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building2, X, Upload, CheckCircle2 } from 'lucide-react';
import { updateInstitution } from '@/actions/institutions';
import styles from '../../kurumlar/Institutions.module.css'; // Reusing styles

interface Institution {
  id: string;
  name: string;
  logo?: string | null;
}

export default function InstitutionSettingsContent({ institution }: { institution: Institution }) {
  const [name, setName] = useState(institution.name);
  const [logo, setLogo] = useState<string | null>(institution.logo || null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo boyutu 2MB\'dan küçük olmalıdır.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const result = await updateInstitution(institution.id, {
      name,
      logo
    });

    if (result.success) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.titleInfo}>
          <h1 className={styles.title}>Kurum Bilgileri</h1>
          <p className={styles.subtitle}>Kurumunuzun adını ve giriş ekranında görünecek olan logoyu buradan güncelleyebilirsiniz.</p>
        </div>
      </header>

      <Card style={{ maxWidth: '800px' }}>
        <CardHeader>Genel Bilgiler</CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className={styles.editForm}>
            <div className={styles.formGroup}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Kurum Adı</label>
              <Input 
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Örn: Namazdayım Erkek Yurdu"
              />
            </div>

            <div className={styles.formGroup}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>Kurum Logosu</label>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Yükleyeceğiniz logo dashboard ve giriş ekranlarında kurumunuzun kimliği olarak gösterilecektir.
              </p>
              
              <div className={styles.logoUploadArea}>
                {logo ? (
                  <div className={styles.logoPreviewWrapper}>
                    <img src={logo} alt="Logo Preview" className={styles.logoPreview} />
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      className={styles.removeLogoBtn}
                      onClick={() => setLogo(null)}
                    >
                      <X size={14} /> Logo Kaldır
                    </Button>
                  </div>
                ) : (
                  <div 
                    className={styles.uploadPlaceholder}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ cursor: 'pointer' }}
                  >
                    <Upload size={32} />
                    <span>Logo Yükle (SVG, PNG, JPG)</span>
                    <p>Önerilen: 200x200px, Max: 2MB</p>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
              <Button type="submit" disabled={loading} style={{ minWidth: '150px' }}>
                {loading ? 'Güncelleniyor...' : 'Kaydet'}
              </Button>
              {success && (
                <div style={{ display: 'flex', alignItems: 'center', color: '#27ae60', fontSize: '0.875rem', fontWeight: '500' }}>
                  <CheckCircle2 size={18} style={{ marginRight: '6px' }} />
                  Değişiklikler başarıyla kaydedildi.
                </div>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
