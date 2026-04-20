import React from 'react';
import { getStudentDetails } from '@/actions/students';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import styles from './StudentDetail.module.css';

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const student = await getStudentDetails(id);
  if (!student) return { title: 'Öğrenci Bulunamadı' };
  return { title: `${student.fullName} | NamazdayımApp` };
}

export default async function StudentDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const student = await getStudentDetails(id);

  if (!student) {
    notFound();
  }

  // İstatistikleri hesapla
  const stats = {
    var: student.attendances.filter(a => a.status === 'VAR').length,
    yok: student.attendances.filter(a => a.status === 'YOK').length,
    gec: student.attendances.filter(a => a.status === 'GEC').length,
    toplam: student.attendances.length
  };

  const getStatusClass = (status: string) => {
    switch(status) {
      case 'VAR': return styles.statusVAR;
      case 'YOK': return styles.statusYOK;
      case 'GEC': return styles.statusGEC;
      case 'IZINLI': return styles.statusIZINLI;
      case 'GOREVLI': return styles.statusGOREVLI;
      default: return '';
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/ogrenciler" className={styles.backBtn} aria-label="Geri Dön">
          <ArrowLeft size={24} />
        </Link>
        <h1 className={styles.title}>Öğrenci Detayı</h1>
      </header>

      <div className={styles.detailsGrid}>
        {/* Sol Kolon: Profil Bilgisi */}
        <div>
          <Card>
            <CardContent>
              <div className={styles.infoCard}>
                <div className={styles.profileHeader}>
                  <div className={styles.avatar}>
                    {student.fullName.charAt(0)}
                  </div>
                  <h2 className={styles.studentName}>{student.fullName}</h2>
                  <Badge variant={student.isActive ? 'success' : 'danger'}>
                    {student.isActive ? 'Aktif Öğrenci' : 'Pasif Kayıt'}
                  </Badge>
                </div>
                
                <div className={styles.infoList}>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Okul No</span>
                    <span className={styles.infoValue}>{student.studentNo}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Sınıf</span>
                    <span className={styles.infoValue}>{student.class?.name || '-'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Seviye</span>
                    <span className={styles.infoValue}>{student.level?.name || '-'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Veli Adı</span>
                    <span className={styles.infoValue}>{student.parentName || '-'}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.infoLabel}>Veli Tel</span>
                    <span className={styles.infoValue}>{student.parentPhone || '-'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sağ Kolon: Yoklama Özeti ve Geçmiş */}
        <div>
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <h3 className={styles.statNumber} style={{ color: 'var(--success)' }}>{stats.var}</h3>
              <p className={styles.statLabel}>Varlığı</p>
            </div>
            <div className={styles.statBox}>
              <h3 className={styles.statNumber} style={{ color: 'var(--danger)' }}>{stats.yok}</h3>
              <p className={styles.statLabel}>Devamsızlık</p>
            </div>
            <div className={styles.statBox}>
              <h3 className={styles.statNumber} style={{ color: 'var(--delay)' }}>{stats.gec}</h3>
              <p className={styles.statLabel}>Geç Kalma</p>
            </div>
            <div className={styles.statBox}>
              <h3 className={styles.statNumber}>{stats.toplam}</h3>
              <p className={styles.statLabel}>Toplam Kayıt</p>
            </div>
          </div>

          <Card>
            <CardHeader>Son Yoklama Kayıtları (İlk 50)</CardHeader>
            <CardContent>
              {student.attendances.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Henüz yoklama kaydı bulunmuyor.
                </div>
              ) : (
                <div className={styles.recordsList}>
                  {student.attendances.map(record => (
                    <div key={record.id} className={styles.recordItem}>
                      <div>
                        <div className={styles.recordDate}>
                          {new Intl.DateTimeFormat('tr-TR').format(new Date(record.date))}
                        </div>
                        <div className={styles.recordPrayer}>
                          {record.prayerTime.name} Vakti
                        </div>
                      </div>
                      <div className={getStatusClass(record.status)}>
                        {record.status}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
