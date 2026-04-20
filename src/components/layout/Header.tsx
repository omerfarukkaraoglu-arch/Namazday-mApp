'use client';
import React from 'react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { User } from 'lucide-react';
import styles from './Layout.module.css';
import Link from 'next/link';

interface HeaderProps {
  displayName: string;
}

export function Header({ displayName }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.headerTitle}>
        {/* Sadece mobilde görünür logo alternatifi eklenebilir */}
        <h1 className={styles.mobileTitle}>Namazdayım</h1>
      </div>
      
      <div className={styles.headerActions}>
        <ThemeToggle />
        <Link href="/profil" className={styles.profileBtn}>
          <div className={styles.avatar}>
            <User size={18} />
          </div>
          <span className={styles.displayName}>{displayName}</span>
        </Link>
      </div>
    </header>
  );
}
