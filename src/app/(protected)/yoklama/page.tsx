import React from 'react';
import { getClassesAndLevels, getPrayerTimes } from '@/actions/attendance';
import { AttendanceClient } from './AttendanceClient';
import styles from './Yoklama.module.css';

export const metadata = { title: 'Yoklama Alma | Namazdayım' };

export default async function YoklamaPage() {
  const [classData, prayerTimes] = await Promise.all([
    getClassesAndLevels(),
    getPrayerTimes()
  ]);

  return (
    <div>
      <div className={styles.header} style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className={styles.title}>Yoklama Al</h1>
          <p className={styles.description}>
            Lütfen tarih, vakit ve sınıf seçerek öğrencilerin durumunu giriniz.
          </p>
        </div>
      </div>

      <AttendanceClient 
        initialClasses={classData.classes}
        initialLevels={classData.levels}
        categories={classData.categories || []}
        prayerTimes={prayerTimes}
      />
    </div>
  );
}
