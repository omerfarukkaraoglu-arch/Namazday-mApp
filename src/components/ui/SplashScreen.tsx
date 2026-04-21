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
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
    >
      <div className={styles.content}>
        {/* Işık Patlaması (Flare) Efekti */}
        <motion.div 
          className={styles.flare}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: [0, 1.5, 2.2], 
            opacity: [0, 0.8, 0] 
          }}
          transition={{ 
            delay: 1.2, 
            duration: 0.8, 
            times: [0, 0.4, 1],
            ease: "easeOut" 
          }}
        />

        <div className={styles.logoWrapper}>
          {/* Tik Çizim Animasyonu */}
          <svg 
            viewBox="0 0 100 100" 
            className={styles.svg}
          >
            <motion.path
              d="M30 50 L45 65 L70 35"
              fill="transparent"
              strokeWidth="6"
              stroke="#D4AF37"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ 
                duration: 0.8, 
                delay: 0.5, 
                ease: "easeInOut" 
              }}
            />
          </svg>

          {/* Logo Çerçevesi (Opsiyonel) */}
          <motion.div 
            className={styles.logoFrame}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>

        {/* Uygulama İsmi */}
        <motion.div
          className={styles.brandName}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
        >
          <span className={styles.accent}>Namaz</span>dayım
        </motion.div>
      </div>
    </motion.div>
  );
};
