import React, { useState, useRef, useEffect } from 'react';
import styles from './MultiSelect.module.css';
import { ChevronDown, Check } from 'lucide-react';

export interface Option {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: Option[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function MultiSelect({
  label,
  options,
  selectedValues,
  onChange,
  placeholder = "Seçiniz...",
  disabled = false
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = (value: string) => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  const selectAll = () => {
    onChange(options.map(o => o.value));
  };

  const clearAll = () => {
    onChange([]);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) return placeholder;
    if (selectedValues.length === 1) {
      const opt = options.find(o => o.value === selectedValues[0]);
      return opt ? opt.label : placeholder;
    }
    if (selectedValues.length === options.length && options.length > 0) {
      return "Tümü Seçili";
    }
    return `${selectedValues.length} Seçili`;
  };

  return (
    <div className={styles.container} ref={containerRef}>
      {label && <label className={styles.label}>{label}</label>}
      <button
        type="button"
        className={styles.button}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {getDisplayText()}
        </span>
        <ChevronDown size={16} style={{ color: 'var(--text-secondary)' }} />
      </button>

      {isOpen && !disabled && (
        <div className={styles.dropdown}>
          <div className={styles.dropdownHeader}>
            <button type="button" className={styles.actionBtn} onClick={selectAll}>Tümünü Seç</button>
            <button type="button" className={styles.actionBtn} onClick={clearAll} style={{ color: 'var(--danger)' }}>Temizle</button>
          </div>
          {options.map((option) => (
            <label key={option.value} className={styles.option}>
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleToggle(option.value)}
              />
              <span className={styles.optionText}>{option.label}</span>
            </label>
          ))}
          {options.length === 0 && (
            <div style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Seçenek bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
