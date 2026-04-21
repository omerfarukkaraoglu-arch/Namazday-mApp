'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, CheckSquare, Users, BarChart3, Settings, User, Building2, Menu, X, LogOut } from 'lucide-react';
import styles from './Layout.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { logout } from '@/actions/auth';

/**
 * Mobil Navigasyon Bileşeni
 * Düzen: Özet, Yoklama, Daha Fazla (Öğrenciler ve Raporlar Daha Fazla içerisine taşındı)
 * Güncellendi: 21 Nisan 2026 - Force Refresh
 */

interface MobileNavProps {
  isAdmin: boolean;
  userRole?: string;
  isSystemAdmin?: boolean;
}

export function MobileNav({ isAdmin, userRole, isSystemAdmin }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);

  // Ana barda sadece en kritik 2 öğe yer alır
  const navItems = [
    { name: 'Özet', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Yoklama', href: '/yoklama', icon: CheckSquare },
  ];

  // Diğer tüm öğeler "Daha Fazla" menüsünde
  const moreItems = [
    { name: 'Öğrenciler', href: '/ogrenciler', icon: Users },
    { name: 'Raporlar', href: '/raporlar', icon: BarChart3 },
    { name: 'Profilim', href: '/profil', icon: User },
  ];

  if (isSystemAdmin) {
    moreItems.push({ name: 'Kurum Yönetimi', href: '/yonetim/kurumlar', icon: Building2 });
  }

  if (isAdmin) {
    moreItems.push({ name: 'Sistem Ayarları', href: '/yonetim/ayarlar', icon: Settings });
  }

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              className={styles.moreMenuOverlay}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMenu}
            />
            <motion.div 
              className={styles.moreMenuContainer}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className={styles.moreMenuHeader}>
                <h3>Daha Fazla</h3>
                <button onClick={closeMenu} className={styles.closeMenuBtn}>
                  <X size={20} />
                </button>
              </div>
              <ul className={styles.moreMenuList}>
                {moreItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link href={item.href} className={styles.moreMenuItem} onClick={closeMenu}>
                        <Icon size={20} />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <button onClick={handleLogout} className={`${styles.moreMenuItem} ${styles.moreMenuLogout}`}>
                    <LogOut size={20} />
                    <span>Güvenli Çıkış</span>
                  </button>
                </li>
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <nav className={styles.mobileNav}>
        <ul className={styles.mobileNavList}>
          {navItems.map((item) => {
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
                  onClick={closeMenu}
                >
                  <div className={isProminent ? styles.prominentIconBox : ''}>
                    <Icon size={isProminent ? 28 : 22} className={styles.mobileNavIcon} />
                  </div>
                  <span className={styles.mobileNavText}>{item.name}</span>
                </Link>
              </li>
            );
          })}
          
          <li className={styles.mobileNavItem}>
            <button 
              className={`${styles.mobileNavLink} ${isOpen ? styles.mobileNavLinkActive : ''}`}
              onClick={toggleMenu}
            >
              <Menu size={22} className={styles.mobileNavIcon} />
              <span className={styles.mobileNavText}>Daha Fazla</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}
