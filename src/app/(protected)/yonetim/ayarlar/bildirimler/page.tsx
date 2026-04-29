import React from 'react';
import { getUserContext } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { NotificationManagerClient } from './NotificationManagerClient';
import styles from '../../Yonetim.module.css';

export const metadata = { title: 'Bildirim Yönetimi | NamazdayımApp' };

export default async function NotificationSettingsPage() {
  const user = await getUserContext();
  if (!user) redirect('/login');

  const institutionId = user.institutionId;

  // Fetch users for the dropdown
  const users = await prisma.user.findMany({
    where: { institutionId, isActive: true },
    select: { id: true, displayName: true, role: true },
    orderBy: { displayName: 'asc' }
  });

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Sistem Bildirimleri</h1>
          <p className={styles.description}>Kurumunuzdaki kullanıcılara manuel bildirim gönderin.</p>
        </div>
      </header>
      
      <div className={styles.content}>
        <NotificationManagerClient users={users} institutionId={institutionId} />
      </div>
    </div>
  );
}
