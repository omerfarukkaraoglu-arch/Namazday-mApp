'use client';

import React from 'react';
import { motion } from 'framer-motion';
import styles from './SplashScreen.module.css';

interface SplashScreenProps {
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  return (
    <motion.div 
      className={styles.overlay}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className={styles.content}>
        {/* Güçlü Işık Patlaması (Radiation Effect) */}
        <motion.div 
          className={styles.mainFlare}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.2, 1.8], 
            opacity: [0, 1, 0] 
          }}
          transition={{ 
            duration: 1.2, 
            times: [0, 0.4, 1],
            ease: "easeOut" 
          }}
        />

        {/* İkincil Parıltı (Glow) */}
        <motion.div 
          className={styles.subGlow}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className={styles.logoWrapper}>
          {/* Kendi Logomuz /logo.png */}
          <motion.img
            src="/logo.png"
            alt="Namazdayım Logo"
            className={styles.logoImg}
            initial={{ scale: 0, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.3
            }}
          />
        </div>

        {/* Uygulama İsmi */}
        <motion.div
          className={styles.brandName}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <span className={styles.accent}>Namaz</span>dayım
        </motion.div>
      </div>
    </motion.div>
  );
};
