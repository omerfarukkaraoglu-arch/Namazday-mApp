import React from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Users, BarChart3, Settings, LogOut, Building2 } from 'lucide-react';
import styles from './Layout.module.css';

interface SidebarProps {
  isAdmin: boolean;
  isSystemAdmin?: boolean;
  userRole?: string;
  institutionName?: string;
  institutionLogo?: string | null;
  onLogout: () => void;
}

export function Sidebar({ isAdmin, isSystemAdmin, institutionName, institutionLogo, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Yoklama Al', href: '/yoklama', icon: CheckSquare },
    { name: 'Öğrenciler', href: '/ogrenciler', icon: Users },
    { name: 'Raporlar', href: '/raporlar', icon: BarChart3 },
  ];

  if (isSystemAdmin) {
    navItems.push({ name: 'Kurumlar', href: '/yonetim/kurumlar', icon: Building2 });
  }

  if (isAdmin || isSystemAdmin) {
    navItems.push({ name: 'Ayarlar', href: '/yonetim/ayarlar', icon: Settings });
  }


  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.brandWrapper}>
          <div className={styles.mainBrand}>
            <img src="/logo.png" alt="Logo" className={styles.appIconImg} />
            <h2 className={styles.appTitle}>Namazdayım</h2>

          </div>
          
          {institutionName && (
            <div className={styles.instCard}>
              <div className={styles.instCardHeader}>AKTİF KURUM</div>
              <div className={styles.instCardBody}>
                {institutionLogo ? (
                  <img src={institutionLogo} alt={institutionName} className={styles.brandLogo} />
                ) : (
                  <div className={styles.miniIcon}><Building2 size={16} /></div>
                )}
                <span className={styles.instName}>{institutionName}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href) && 
                             (item.href !== '/dashboard' || pathname === '/dashboard');
            return (
              <li key={item.href} className={styles.navItem}>
                <a 
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                  style={{ cursor: 'pointer', zIndex: 50, position: 'relative' }}
                >
                  <Icon size={20} className={styles.navIcon} />
                  <span>{item.name}</span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className={styles.sidebarFooter}>
        <button onClick={onLogout} className={styles.logoutBtn}>
          <LogOut size={20} />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </aside>
  );
}
