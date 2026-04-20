import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Users, CheckCircle, Clock, AlertTriangle, PartyPopper, Trophy, Star, Medal, Users2 } from 'lucide-react';
import styles from './Dashboard.module.css';
import { getDashboardStats } from '@/actions/reports';

export const metadata = {
  title: 'Dashboard | Namazdayım',
};

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  
  const todayDate = new Intl.DateTimeFormat('tr-TR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }).format(new Date());

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Bugünün Özeti</h1>
          <p className={styles.date}>{todayDate}</p>
        </div>
      </header>

      {/* Main Status Banner: Celebration or Warning */}
      {stats?.fullAttendance ? (
        <div className={styles.fullHouseBanner}>
          <PartyPopper size={48} />
          <div className={styles.fullHouseText}>
            <h3>Bugün Herkes Tam Kadro! 🎉</h3>
            <p>Tebrikler! Bugün şu ana kadar hiç kimse yoklama kaçırmadı.</p>
          </div>
        </div>
      ) : stats?.attentionNeededStudent ? (
        <Card className={styles.spotlightCard}>
          <CardContent style={{ padding: '1.5rem' }}>
            <div className={styles.spotlightHeader}>
              <AlertTriangle size={24} />
              <h3 style={{ margin: 0, fontWeight: 700 }}>Günün Dikkat Çeken İsmi</h3>
            </div>
            <div style={{ marginTop: '1rem' }}>
              <p style={{ margin: 0, fontSize: '1.1rem' }}>
                <strong>{stats.attentionNeededStudent.name}</strong>, bugün toplam <strong>{stats.attentionNeededStudent.count}</strong> vakit kaçırdı.
              </p>
              <div className={styles.missedVakits}>
                {stats.attentionNeededStudent.prayerTimes.map((v: string, i: number) => (
                  <span key={i} className={styles.vakitBadge}>{v}</span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Stars of the Day (Successful Levels) */}
      {stats?.successfulLevels && stats.successfulLevels.length > 0 && (
        <div style={{ marginTop: '-0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#2f855a', marginBottom: '0.5rem' }}>
             <Star size={16} fill="#2f855a" /> Bugünün Yıldız Seviyeleri
          </div>
          <div className={styles.starsContainer}>
            {stats.successfulLevels.map((level: string) => (
              <div key={level} className={styles.starLevel}>
                {level} bugün full namazdaydı!
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <Card>
          <CardContent className={styles.statCard}>
            <div className={styles.statIconContainer} style={{ background: 'rgba(52, 152, 219, 0.1)', color: 'var(--blue)' }}>
              <Users size={24} />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Toplam Öğrenci</p>
              <h3 className={styles.statValue}>{stats?.totalStudents || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={styles.statCard}>
            <div className={styles.statIconContainer} style={{ background: 'rgba(39, 174, 96, 0.1)', color: 'var(--success)' }}>
              <CheckCircle size={24} />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Bugünkü Girişler</p>
              <h3 className={styles.statValue}>{stats?.attendanceToday || 0}</h3>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className={styles.statCard}>
            <div className={styles.statIconContainer} style={{ background: 'rgba(243, 156, 18, 0.1)', color: 'var(--warning)' }}>
              <Clock size={24} />
            </div>
            <div className={styles.statInfo}>
              <p className={styles.statLabel}>Bekleyen Kayıt</p>
              <h3 className={styles.statValue}>İşleniyor</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Champions Panel */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Trophy size={20} color="#f1c40f" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Haftalık Şampiyonlar</h2>
        </div>
        <div className={styles.championsPanel}>
          <div className={styles.championItem}>
            <div className={styles.champHeader}>
              <div className={styles.trophyBox}><Medal size={20} /></div>
              <span className={styles.champTitle}>Haftanın Öğrencisi</span>
            </div>
            <div className={styles.champMain}>
              <span className={styles.champName}>{stats?.topWeeklyStudent?.name || 'Hesaplanıyor...'}</span>
              <span className={styles.champSub}>{stats?.topWeeklyStudent?.count || 0} Vakit Katılım</span>
            </div>
          </div>

          <div className={styles.championItem}>
            <div className={styles.champHeader}>
              <div className={styles.trophyBox} style={{ background: '#e3f2fd', color: '#2196f3' }}><Users2 size={20} /></div>
              <span className={styles.champTitle}>Haftanın Sınıfı</span>
            </div>
            <div className={styles.champMain}>
              <span className={styles.champName}>{stats?.topWeeklyClass?.name || 'Hesaplanıyor...'}</span>
              <span className={styles.champSub}>En Yüksek Oran</span>
            </div>
          </div>

          <div className={styles.championItem}>
            <div className={styles.champHeader}>
              <div className={styles.trophyBox} style={{ background: '#f3e5f5', color: '#9c27b0' }}><Trophy size={20} /></div>
              <span className={styles.champTitle}>Haftanın Seviyesi</span>
            </div>
            <div className={styles.champMain}>
              <span className={styles.champName}>{stats?.topWeeklyLevel?.name || 'Hesaplanıyor...'}</span>
              <span className={styles.champSub}>En Disiplinli Seviye</span>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.sectionsGrid}>
        {/* Son Yoklamalar */}
        <Card className={styles.recentCard}>
          <CardHeader>Son Yoklama Durumları</CardHeader>
          <CardContent>
            {stats?.recentAttendances && stats.recentAttendances.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {stats.recentAttendances.map((a: any, idx: number) => (
                  <li key={idx} style={{ padding: '0.8rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.875rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span><strong>{a.student.fullName}</strong> - {a.prayerTime.name}</span>
                    <span style={{ color: a.status === 'YOK' ? 'var(--danger)' : 'var(--success)', fontWeight: 600 }}>{a.status}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className={styles.emptyState}>
                <Clock size={32} className={styles.emptyIcon} />
                <p>Bugün henüz yoklama alınmadı.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dikkat Gerektirenler / Bilgi */}
        <Card className={styles.alertCard}>
          <CardHeader style={{ color: 'var(--primary)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={20} />
              <span>Cuma Günü Bilgilendirmesi</span>
            </div>
          </CardHeader>
          <CardContent>
            <div style={{ padding: '1rem', background: 'var(--bg)', borderRadius: '8px', borderLeft: '4px solid var(--blue)' }}>
              <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6 }}>Cuma vakitleri için yoklama saatleri revize edilmiştir. Lütfen güncel vakitleri takip ediniz.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
