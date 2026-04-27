'use client';
import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { logout } from '@/actions/auth';
import { PageWrapper } from '../ui/PageWrapper';
import { hasAdminPrivileges, checkRole } from '@/lib/auth';
import { BadgeManager } from '../notifications/BadgeManager';
import { PushManager } from '../notifications/PushManager';
import styles from './Layout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
  user: {
    username: string;
    displayName: string;
    role: string;
    institutionName?: string;
    institutionLogo?: string | null;
  };
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const isAdmin = hasAdminPrivileges(user);
  const isSystemAdmin = checkRole(user.role, 'SYSTEM_ADMIN') || user.username === 'admin';

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className={styles.appContainer}>
      <BadgeManager />
      <PushManager />
      {/* Desktop Sidebar */}
      <div className={styles.sidebarWrapper}>
        <Sidebar 
          isAdmin={isAdmin} 
          isSystemAdmin={isSystemAdmin}
          userRole={user.role}
          institutionName={user.institutionName} 
          institutionLogo={user.institutionLogo}
          onLogout={handleLogout} 
        />
      </div>

      {/* Main Content Area */}
      <div className={styles.mainWrapper}>
        <Header displayName={user.displayName} />
        
        <main className={styles.mainContent}>
          <div className={styles.contentInner}>
            <PageWrapper>
              {children}
            </PageWrapper>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className={styles.mobileNavWrapper}>
        <MobileNav isAdmin={isAdmin} userRole={user.role} isSystemAdmin={isSystemAdmin} />
      </div>
    </div>
  );
}
