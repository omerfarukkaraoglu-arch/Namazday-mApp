import React, { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import styles from './Table.module.css';

export function Table({ children, className = '', ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className={styles.wrapper}>
      <table className={`${styles.table} ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHead({ children, className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={`${styles.thead} ${className}`} {...props}>{children}</thead>;
}

export function TableBody({ children, className = '', ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={className} {...props}>{children}</tbody>;
}

export function TableRow({ children, className = '', ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={`${styles.tr} ${className}`} {...props}>{children}</tr>;
}

export function TableHeader({ children, className = '', ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={`${styles.th} ${className}`} {...props}>{children}</th>;
}

export function TableCell({ children, className = '', ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={`${styles.td} ${className}`} {...props}>{children}</td>;
}
