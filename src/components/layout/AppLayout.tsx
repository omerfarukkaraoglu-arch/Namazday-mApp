'use client';
import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { logout } from '@/actions/auth';
import { PageWrapper } from '../ui/PageWrapper';
import { hasAdminPrivileges, checkRole } from '@/lib/auth';
import { BadgeManager } from '../notifications/BadgeManager';
import OneSignal from 'react-onesignal';
import styles from './Layout.module.css';

interface AppLayoutProps {
  children: React.ReactNode;
  user: {
    id: string;
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

  React.useEffect(() => {
    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: "68d859c0-49f7-4504-ab5a-f78323bd2a9a",
          allowLocalhostAsSecureOrigin: true,
        });
        
        if (user.id) {
          OneSignal.login(user.id);
        }
      } catch (e) {
        console.error("OneSignal init error", e);
      }
    };
    
    if (typeof window !== 'undefined') {
      initOneSignal();
    }
  }, [user.id]);

  const handleLogout = async () => {
    // Optionally logout from OneSignal before app logout
    try { await OneSignal.logout(); } catch (e) {}
    await logout();
  };

  return (
    <div className={styles.appContainer}>
      <BadgeManager />

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
