'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { saveAttendance, getStudentsForAttendance, getDailyAttendance } from '@/actions/attendance';
import styles from './Yoklama.module.css';
import { Check, X, Clock, FileText, UserPlus, Save, Search, ArrowUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/components/ui/PageWrapper';

interface AttendanceClientProps {
  initialClasses: any[];
  initialLevels: any[];
  categories: any[];
  prayerTimes: any[];
}

export function AttendanceClient({ initialClasses, initialLevels, categories, prayerTimes }: AttendanceClientProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPrayer, setSelectedPrayer] = useState(prayerTimes[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'class' | 'level'>('name');
  
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Vakit otomatik seçme (saate göre)
  useEffect(() => {
    const hour = new Date().getHours();
    let defaultPrayer = prayerTimes[0]?.id;
    
    // Basit bir saate göre vakit tahmini (varsayımsal saatler)
    if (hour >= 4 && hour < 10) defaultPrayer = prayerTimes.find(p => p.name === 'Sabah')?.id || defaultPrayer;
    else if (hour >= 10 && hour < 14) defaultPrayer = prayerTimes.find(p => p.name === 'Öğle')?.id || defaultPrayer;
    else if (hour >= 14 && hour < 17) defaultPrayer = prayerTimes.find(p => p.name === 'İkindi')?.id || defaultPrayer;
    else if (hour >= 17 && hour < 19) defaultPrayer = prayerTimes.find(p => p.name === 'Akşam')?.id || defaultPrayer;
    else if (hour >= 19) defaultPrayer = prayerTimes.find(p => p.name === 'Yatsı')?.id || defaultPrayer;

    if (defaultPrayer) setSelectedPrayer(defaultPrayer);
  }, [prayerTimes]);

  // Öğrencileri ve mevcut yoklamayı getir
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [studentData, existingAttendance] = await Promise.all([
          getStudentsForAttendance(selectedPrayer, selectedClass || undefined, selectedLevel || undefined),
          getDailyAttendance(new Date(selectedDate), selectedPrayer)
        ]);

        setStudents(studentData);
        
        // Map existing attendance
        const attendanceMap: Record<string, string> = {};
        
        // Varsayılan olarak tüm öğrencileri YOK (veya boş) işaretleyebiliriz.
        // Plan'a göre: Varsayılan Tümü "YOK"
        studentData.forEach(s => {
          attendanceMap[s.id] = 'YOK'; 
        });

        // Eğer veritabanında varsa üzerine yaz
        existingAttendance.forEach((record: any) => {
          attendanceMap[record.studentId] = record.status;
        });

        setAttendance(attendanceMap);
      } catch (error) {
        console.error("Veri yüklenemedi", error);
      } finally {
        setLoading(false);
      }
    };

    if (selectedPrayer && selectedDate) {
      loadData();
    }
  }, [selectedClass, selectedLevel, selectedPrayer, selectedDate]);

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const markAllAs = (status: string) => {
    const newMap = { ...attendance };
    students.forEach(s => {
      newMap[s.id] = status;
    });
    setAttendance(newMap);
  };

  const handleSave = async () => {
    if (students.length === 0) return;
    
    setSaving(true);
    const dataToSave = Object.entries(attendance).map(([studentId, status]) => ({
      studentId,
      prayerTimeId: selectedPrayer,
      date: new Date(selectedDate),
      status
    }));

    const result = await saveAttendance(dataToSave);
    if (!result?.error) {
      alert("Yoklama başarıyla kaydedildi!");
    } else {
      alert(result.error);
    }
    setSaving(false);
  };

  const stats = {
    var: Object.values(attendance).filter(s => s === 'VAR').length,
    yok: Object.values(attendance).filter(s => s === 'YOK').length,
    gec: Object.values(attendance).filter(s => s === 'GEC').length,
    izinli: Object.values(attendance).filter(s => s === 'IZINLI').length,
    gorevli: Object.values(attendance).filter(s => s === 'GOREVLI').length,
  };

  return (
    <div className={styles.container}>
      <Card className={styles.filtersCard}>
        <CardContent>
          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Tarih</span>
              <Input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                fullWidth={false}
              />
            </div>
            
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Vakit</span>
              <Select value={selectedPrayer} onChange={e => setSelectedPrayer(e.target.value)}>
                {prayerTimes.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Kategori / Statü</span>
              <Select value={selectedCategory} onChange={e => {
                setSelectedCategory(e.target.value);
                setSelectedClass('');
                setSelectedLevel('');
              }}>
                <option value="">Tümü</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </Select>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Sınıf Filtresi</span>
              <Select value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
                <option value="">Tümü</option>
                {initialClasses
                  .filter(c => !selectedCategory || c.categoryId === selectedCategory)
                  .map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))
                }
              </Select>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Seviye Filtresi</span>
              <Select value={selectedLevel} onChange={e => setSelectedLevel(e.target.value)}>
                <option value="">Tümü</option>
                {initialLevels
                  .filter(l => !selectedCategory || l.categoryId === selectedCategory)
                  .map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))
                }
              </Select>
            </div>
          </div>
          
          <div className={styles.searchSortRow}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} size={18} />
              <input 
                type="text" 
                placeholder="Öğrenci adı ile ara..." 
                className={styles.searchInput}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className={styles.sortWrapper}>
              <ArrowUpDown size={16} />
              <Select value={sortBy} onChange={e => setSortBy(e.target.value as any)} fullWidth={false}>
                <option value="name">İsim (A-Z)</option>
                <option value="class">Sınıf (Öncelik)</option>
                <option value="level">Seviye (Öncelik)</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className={styles.emptyState}>Yükleniyor...</div>
      ) : (() => {
        const currentPrayer = prayerTimes.find(p => p.id === selectedPrayer);
        const dayOfWeek = new Date(selectedDate).getDay().toString();
        const isActiveToday = currentPrayer?.activeDays?.split(',').includes(dayOfWeek);

        if (!isActiveToday) {
          return (
            <Card style={{ backgroundColor: 'var(--surface-hover)', border: '1px dashed var(--border)' }}>
              <CardContent>
                <div className={styles.emptyState} style={{ color: 'var(--danger)' }}>
                  ⚠️ Bu vakit (<b>{currentPrayer?.name}</b>) seçili günde ({new Intl.DateTimeFormat('tr-TR', { weekday: 'long' }).format(new Date(selectedDate))}) yoklamadan muaftır.
                </div>
              </CardContent>
            </Card>
          );
        }

        const filteredStudents = students.filter(s => 
          s.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        ).sort((a, b) => {
          if (sortBy === 'name') return a.fullName.localeCompare(b.fullName, 'tr');
          if (sortBy === 'class') {
            if (a.class.sortOrder !== b.class.sortOrder) return a.class.sortOrder - b.class.sortOrder;
            return a.fullName.localeCompare(b.fullName, 'tr');
          }
          if (sortBy === 'level') {
            if (a.level.sortOrder !== b.level.sortOrder) return a.level.sortOrder - b.level.sortOrder;
            return a.fullName.localeCompare(b.fullName, 'tr');
          }
          return 0;
        });

        if (filteredStudents.length === 0) {
          return <div className={styles.emptyState}>Aranan kriterlere uygun öğrenci bulunamadı.</div>;
        }

        return (
          <>
            <motion.div 
              className={styles.studentList}
              variants={staggerContainer}
              initial="hidden"
              animate="show"
            >
              <AnimatePresence mode="popLayout">
                {filteredStudents.map(student => (
                  <motion.div 
                    layout
                    key={student.id} 
                    className={styles.studentCard}
                    variants={staggerItem}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                  <div className={styles.studentInfo}>
                    <div className={styles.avatar}>
                      {student.fullName.charAt(0)}
                    </div>
                    <div className={styles.studentDetails}>
                      <h3>{student.fullName}</h3>
                      <p>{student.studentNo} • {student.class?.name} • {student.level?.name}</p>
                    </div>
                  </div>
                  
                  <div className={styles.statusButtons}>
                    <button 
                      className={`${styles.statusBtn} ${attendance[student.id] === 'VAR' ? styles.activeVAR : ''}`}
                      onClick={() => handleStatusChange(student.id, 'VAR')}
                    >
                      <Check size={14} /> VAR
                    </button>
                    <button 
                      className={`${styles.statusBtn} ${attendance[student.id] === 'YOK' ? styles.activeYOK : ''}`}
                      onClick={() => handleStatusChange(student.id, 'YOK')}
                    >
                      <X size={14} /> YOK
                    </button>
                    <button 
                      className={`${styles.statusBtn} ${attendance[student.id] === 'GEC' ? styles.activeGEC : ''}`}
                      onClick={() => handleStatusChange(student.id, 'GEC')}
                    >
                      <Clock size={14} /> GEÇ
                    </button>
                    <button 
                      className={`${styles.statusBtn} ${attendance[student.id] === 'IZINLI' ? styles.activeIZINLI : ''}`}
                      onClick={() => handleStatusChange(student.id, 'IZINLI')}
                    >
                      <FileText size={14} /> İZİNLİ
                    </button>
                    <button 
                      className={`${styles.statusBtn} ${attendance[student.id] === 'GOREVLI' ? styles.activeGOREVLI : ''}`}
                      onClick={() => handleStatusChange(student.id, 'GOREVLI')}
                    >
                      <UserPlus size={14} /> GÖREVLİ
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

            <div className={styles.actionBar}>
              <div className={styles.actionStats}>
                <span style={{color: 'var(--success)'}}>VAR: {stats.var}</span>
                <span style={{color: 'var(--danger)'}}>YOK: {stats.yok}</span>
                <span style={{color: 'var(--delay)'}}>GEÇ: {stats.gec}</span>
              </div>
              
              <div className={styles.massActions}>
                <Button variant="secondary" onClick={() => markAllAs('VAR')}>Tümünü Var Yap</Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                  <Save size={18} /> {saving ? 'Kaydediliyor...' : 'Yoklamayı Kaydet'}
                </Button>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}
