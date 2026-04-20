import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { User, Shield, LogOut } from 'lucide-react';
import { getUserContext } from '@/lib/auth-server';
import { LogoutButton } from './LogoutButton'; // Client component for logout button
import styles from './Profil.module.css';

export const metadata = { title: 'Hesabım | Namazdayım' };

export default async function ProfilePage() {
  const user = await getUserContext();

  if (!user) return null;

  const getRoleLabel = (role: string) => {
    const r = role.toUpperCase();
    if (r === 'SYSTEM_ADMIN') return 'Sistem Yöneticisi';
    if (r === 'SUPER_ADMIN' || r === 'ADMIN') return 'Kurum Yöneticisi';
    if (r === 'YOKLAMACI') return 'Öğretmen / Yoklamacı';
    return role;
  };

  const initial = user.displayName ? user.displayName.charAt(0).toUpperCase() : '?';

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.avatar}>
          {initial}
        </div>
        <h1 className={styles.title}>Hesabım</h1>
        <p className={styles.subtitle}>Kullanıcı profilini yönetin</p>
      </header>

      <div className={styles.grid}>
        <Card>
          <CardHeader>Kişisel Bilgiler</CardHeader>
          <CardContent>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <User size={20} className={styles.infoIcon} />
                <div>
                  <div className={styles.label}>Ad Soyad</div>
                  <div className={styles.value}>{user.displayName}</div>
                </div>
              </div>
              <div className={styles.infoItem}>
                <Shield size={20} className={styles.infoIcon} />
                <div>
                  <div className={styles.label}>Yetki Seviyesi</div>
                  <div className={styles.roleBadge}>{getRoleLabel(user.role)}</div>
                </div>
              </div>
              <div className={styles.infoItem}>
                <div style={{ padding: '0.75rem', borderRadius: '50%', backgroundColor: '#f39c1220', color: '#f39c12', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '40px', height: '40px' }}>
                  <span style={{ fontSize: '1.2rem' }}>🏢</span>
                </div>
                <div style={{ marginLeft: '0.75rem' }}>
                  <div className={styles.label}>Bağlı Kurum</div>
                  <div className={styles.value}>{user.institutionName || 'Tanımlanmamış'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardContent style={{ padding: '0.5rem' }}>
            <LogoutButton />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
