import React, { InputHTMLAttributes } from 'react';
import styles from './Input.module.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  icon,
  fullWidth = true,
  className = '',
  id,
  ...props
}: InputProps) {
  const generatedId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  
  return (
    <div className={`${styles.container} ${fullWidth ? styles['container-full'] : ''}`}>
      {label && (
        <label htmlFor={generatedId} className={styles.label}>
          {label}
        </label>
      )}
      <div className={styles.inputWrapper}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <input
          id={generatedId}
          className={`${styles.input} ${error ? styles['input-error'] : ''} ${icon ? styles['input-with-icon'] : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
