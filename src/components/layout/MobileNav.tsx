'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Users, BarChart3, Settings, User, Building2 } from 'lucide-react';
import styles from './Layout.module.css';
import { hasAdminPrivileges, checkRole } from '@/lib/auth';

interface MobileNavProps {
  isAdmin: boolean;
  userRole?: string;
}

export function MobileNav({ isAdmin, userRole }: MobileNavProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Özet', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Yoklama', href: '/yoklama', icon: CheckSquare },
    { name: 'Öğrenciler', href: '/ogrenciler', icon: Users },
    { name: 'Raporlar', href: '/raporlar', icon: BarChart3 },
  ];

  if (checkRole(userRole, 'SYSTEM_ADMIN')) {
    navItems.push({ name: 'Kurum', href: '/yonetim/kurumlar', icon: Building2 });
  }

  if (isAdmin) {
    navItems.push({ name: 'Ayarlar', href: '/yonetim/ayarlar', icon: Settings });
  }

  navItems.push({ name: 'Profil', href: '/profil', icon: User });

  const others = navItems.filter(item => item.name !== 'Yoklama');
  const yoklamaItem = navItems.find(item => item.name === 'Yoklama');

  // "Yoklama"yı her zaman ortaya (3. sıraya) yerleştiriyoruz
  const mobileItems = [...others.slice(0, 2), yoklamaItem, ...others.slice(2)].filter(Boolean).slice(0, 5);

  return (
    <nav className={styles.mobileNav}>
      <ul className={styles.mobileNavList}>
        {mobileItems.map((item, index) => {
          if (!item) return null;
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href) && 
                           (item.href !== '/dashboard' || pathname === '/dashboard');
          
          const isProminent = item.name === 'Yoklama';

          return (
            <li key={item.href} className={`${styles.mobileNavItem} ${isProminent ? styles.prominentWrapper : ''}`}>
              <Link 
                href={item.href}
                className={`
                  ${styles.mobileNavLink} 
                  ${isActive ? styles.mobileNavLinkActive : ''} 
                  ${isProminent ? styles.prominentLink : ''}
                `}
              >
                <div className={isProminent ? styles.prominentIconBox : ''}>
                  <Icon size={isProminent ? 28 : 22} className={styles.mobileNavIcon} />
                </div>
                <span className={styles.mobileNavText}>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
