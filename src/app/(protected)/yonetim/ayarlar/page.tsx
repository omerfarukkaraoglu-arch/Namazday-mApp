import React from 'react';
import { hasAdminPrivileges, isVIPAdmin } from '@/lib/auth';
import { getUserContext } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/Card';
import { Users, School, Layers, Clock, Building2 } from 'lucide-react';
import styles from '../Yonetim.module.css';

export const metadata = { title: 'Sistem Ayarları | NamazdayımApp' };

export default async function SettingsHubPage() {
  const user = await getUserContext();
  if (!user || (!hasAdminPrivileges(user.role) && !isVIPAdmin(user))) {
    redirect('/dashboard');
  }

  const settingLinks = [
    { title: 'Kurum Bilgileri', description: 'Kurum adı ve logosunu güncelleyin.', href: '/yonetim/ayarlar/kurum', icon: Building2, color: '#e67e22' },
    { title: 'Sistem Kullanıcıları', description: 'Öğretmenler, Yöneticiler, Yoklamacılar hesap ayarları.', href: '/yonetim/kullanicilar', icon: Users, color: '#3498db' },
    { title: 'Sınıf Yönetimi', description: 'Sınıfları ekleyin ve düzenleyin.', href: '/yonetim/siniflar', icon: School, color: '#2ecc71' },
    { title: 'Seviye Yönetimi', description: 'Öğrenci kademelerini, hafızlık seviyelerini belirleyin.', href: '/yonetim/seviyeler', icon: Layers, color: '#f39c12' },
    { title: 'Kategori / Statü Yönetimi', description: 'Ortaokul, Lise gibi ana grupları belirleyin.', href: '/yonetim/kategoriler', icon: Building2, color: '#e74c3c' },
    { title: 'Yoklama Vakitleri', description: 'Günlük vakitleri ve ek ibadet türlerini oluşturun.', href: '/yonetim/vakitler', icon: Clock, color: '#9b59b6' },
    { title: 'Bildirim Yönetimi', description: 'Sistem kullanıcılarına toplu veya özel mesaj gönderin.', href: '/yonetim/ayarlar/bildirimler', icon: Layers, color: '#1abc9c' },
  ];



  return (
    <div className={styles.container}>
      <header className={styles.header} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
        <h1 className={styles.title}>Sistem Ayarları</h1>
        <p className={styles.description}>Tüm temel veritabanı ayarlarını ve yönetimini buradan yapabilirsiniz.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
        {settingLinks.map((link, idx) => {
          const Icon = link.icon;
          return (
            <Link key={idx} href={link.href} style={{ textDecoration: 'none' }}>
              <Card style={{ height: '100%', transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer' }} className="hover-card">
                <CardContent style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '0.75rem', borderRadius: '50%', backgroundColor: `${link.color}20`, color: link.color }}>
                      <Icon size={24} />
                    </div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text)', margin: 0 }}>{link.title}</h2>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                    {link.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
