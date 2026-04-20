import React from 'react';
import styles from './Badge.module.css';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'danger' | 'warning' | 'info' | 'delay' | 'neutral';
  children: React.ReactNode;
}

export function Badge({ variant = 'neutral', children, className = '', ...props }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[`badge-${variant}`]} ${className}`} {...props}>
      {children}
    </span>
  );
}
