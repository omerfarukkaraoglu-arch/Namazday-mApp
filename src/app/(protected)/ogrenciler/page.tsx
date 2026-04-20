import React from 'react';
import { getStudents, getClassesAndLevels } from '@/actions/students';
import { hasAdminPrivileges } from '@/lib/auth';
import { getUserContext } from '@/lib/auth-server';
import { StudentClient } from './StudentClient';
import styles from './Ogrenciler.module.css';

export const metadata = { title: 'Öğrenciler | NamazdayımApp' };

export default async function StudentsPage() {
  const user = await getUserContext();
  const isAdmin = hasAdminPrivileges(user?.role);

  const [students, { classes, levels }] = await Promise.all([
    getStudents(),
    getClassesAndLevels()
  ]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Öğrenci Yönetimi</h1>
          <p className={styles.description}>Tüm öğrencileri listeleyin, arayın ve yönetin.</p>
        </div>
      </div>

      <StudentClient 
        students={students} 
        classes={classes} 
        levels={levels} 
        isAdmin={isAdmin}
      />
    </div>
  );
}
