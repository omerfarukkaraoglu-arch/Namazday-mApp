import React, { SelectHTMLAttributes } from 'react';
import styles from './Input.module.css'; // Reusing Input styles for consistency

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export function Select({
  label,
  error,
  fullWidth = true,
  className = '',
  id,
  children,
  ...props
}: SelectProps) {
  const generatedId = id || (label ? `select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);
  
  return (
    <div className={`${styles.container} ${fullWidth ? styles['container-full'] : ''}`}>
      {label && (
        <label htmlFor={generatedId} className={styles.label}>
          {label}
        </label>
      )}
      <select
        id={generatedId}
        className={`${styles.input} ${error ? styles['input-error'] : ''} ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  );
}
