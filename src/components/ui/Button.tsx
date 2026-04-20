import React, { ButtonHTMLAttributes } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'glass' | 'success' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}: ButtonProps) {
  const btnClass = `
    ${styles.btn} 
    ${styles[`btn-${variant}`]} 
    ${styles[`btn-${size}`]} 
    ${fullWidth ? styles['btn-full'] : ''} 
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button className={btnClass} {...props}>
      {children}
    </button>
  );
}
