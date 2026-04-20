'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { createOrUpdateStudent, toggleStudentStatus, bulkImportStudents, deleteStudents, bulkToggleStudentStatus, bulkImportStudentsFromExcel } from '@/actions/students';
import styles from './Ogrenciler.module.css';
import { Search, Plus, Edit, Power, PowerOff, Upload, Trash2, CheckSquare, Square, X, Download, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import { downloadStudentTemplate, fileToBase64 } from '@/lib/excelUtils';

export function StudentClient({ students, classes, levels, isAdmin }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'no' | 'class'>('name');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [editStudent, setEditStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const filteredStudents = students.filter((s: any) => {
    const matchSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        s.studentNo.includes(searchTerm);
    const matchClass = filterClass ? s.classId === filterClass : true;
    return matchSearch && matchClass;
  }).sort((a: any, b: any) => {
    if (sortBy === 'name') return a.fullName.localeCompare(b.fullName, 'tr');
    if (sortBy === 'no') return a.studentNo.localeCompare(b.studentNo);
    if (sortBy === 'class') {
      if (a.class?.sortOrder !== b.class?.sortOrder) return (a.class?.sortOrder || 0) - (b.class?.sortOrder || 0);
      return a.fullName.localeCompare(b.fullName, 'tr');
    }
    return 0;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredStudents.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredStudents.map((s: any) => s.id));
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`${selectedIds.length} öğrenciyi TAMAMEN silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      setLoading(true);
      const res = await deleteStudents(selectedIds);
      if (res.error) alert(res.error);
      else setSelectedIds([]);
      setLoading(false);
    }
  };

  const handleBulkToggle = async (status: boolean) => {
    if (confirm(`${selectedIds.length} öğrenciyi ${status ? 'aktif' : 'pasif'} yapmak istediğinize emin misiniz?`)) {
      setLoading(true);
      const res = await bulkToggleStudentStatus(selectedIds, status);
      if (res.error) alert(res.error);
      else setSelectedIds([]);
      setLoading(false);
    }
  };

  const handleDeleteSingle = async (id: string, name: string) => {
    if (confirm(`'${name}' isimli öğrenciyi TAMAMEN silmek istediğinize emin misiniz?`)) {
      setLoading(true);
      const res = await deleteStudents([id]);
      if (res.error) alert(res.error);
      setLoading(false);
    }
  };

  const openModal = (student: any = null) => {
    if (student) {
      setEditStudent(student);
      setFormData({
        fullName: student.fullName,
        studentNo: student.studentNo,
        classId: student.classId,
        levelId: student.levelId,
        parentName: student.parentName || '',
        parentPhone: student.parentPhone || ''
      });
    } else {
      setEditStudent(null);
      setFormData({
        fullName: '', studentNo: '', classId: classes[0]?.id || '', levelId: levels[0]?.id || '', parentName: '', parentPhone: ''
      });
    }
    setIsModalOpen(true);
  };
// ... (omitting form states and submit handlers for brevity, keeping only the return logic)
  const [formData, setFormData] = useState({
    fullName: '', studentNo: '', classId: '', levelId: '', parentName: '', parentPhone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await createOrUpdateStudent({ id: editStudent?.id, ...formData });
    if (result.error) alert(result.error);
    else setIsModalOpen(false);
    setLoading(false);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    if (confirm(`Öğrenciyi ${currentStatus ? 'pasif' : 'aktif'} yapmak istediğinize emin misiniz?`)) {
      await toggleStudentStatus(id, currentStatus);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (excelFile) {
      setLoading(true);
      try {
        const base64 = await fileToBase64(excelFile);
        const result = await bulkImportStudentsFromExcel(base64);
        if (result.error) alert(result.error);
        else {
          alert(`Excel aktarımı başarılı! İşlenen: ${result.successCount}, Hatalı Satır: ${result.errorCount}`);
          setExcelFile(null);
          setIsBulkModalOpen(false);
        }
      } catch (err) {
        alert('Dosya okunurken bir hata oluştu.');
      }
      setLoading(false);
    } else if (csvText.trim()) {
      setLoading(true);
      const result = await bulkImportStudents(csvText);
      if (result.error) alert(result.error);
      else {
        alert(`Toplu ekleme başarılı! İşlenen: ${result.successCount}, Hatalı Satır: ${result.errorCount}`);
        setCsvText('');
        setIsBulkModalOpen(false);
      }
      setLoading(false);
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          {selectedIds.length > 0 && isAdmin && (
            <div className={styles.bulkBarWrapper}>
              <div className={styles.bulkBarInfo}>
                <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])}>
                  <X size={18} />
                </Button>
                <span>{selectedIds.length} Öğrenci Seçildi</span>
              </div>
              <div className={styles.bulkBarActions}>
                <Button variant="secondary" size="sm" onClick={() => handleBulkToggle(true)}>Aktif Yap</Button>
                <Button variant="secondary" size="sm" onClick={() => handleBulkToggle(false)}>Pasif Yap</Button>
                <Button variant="danger" size="sm" onClick={handleBulkDelete}>Seçilenleri Sil</Button>
              </div>
            </div>
          )}

          <div className={styles.filtersGrid}>
            <div className={styles.filterGroup}>
              <Input 
                placeholder="Öğrenci Adı veya No..." 
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setSelectedIds([]); }}
                icon={<Search size={18} />}
              />
            </div>
            <div className={styles.filterGroup}>
              <Select value={filterClass} onChange={e => { setFilterClass(e.target.value); setSelectedIds([]); }}>
                <option value="">Tüm Sınıflar</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div className={styles.filterGroup}>
              <Select value={sortBy} onChange={e => setSortBy(e.target.value as any)}>
                <option value="name">İsim (A-Z)</option>
                <option value="no">Öğrenci No</option>
                <option value="class">Sınıf (Sıra No)</option>
              </Select>
            </div>
            <div className={styles.filterGroup} style={{ justifyContent: 'flex-end', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
               {isAdmin && (
                <>
                  <Button variant="secondary" onClick={() => setIsBulkModalOpen(true)} style={{ height: '2.5rem' }}>
                    <Upload size={18} /> Toplu İçe Aktar
                  </Button>
                  <Button onClick={() => openModal()} style={{ height: '2.5rem' }}>
                    <Plus size={18} /> Yeni Öğrenci
                  </Button>
                </>
               )}
            </div>
          </div>

          <div className={styles.tableCard}>
            <Table className={styles.table}>
              <TableHead>
                <TableRow>
                  {isAdmin && (
                    <TableHeader className={styles.checkboxCell}>
                      <div onClick={toggleSelectAll} style={{ cursor: 'pointer' }}>
                        {selectedIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
                          <CheckSquare size={20} className={styles.checkboxIconActive} />
                        ) : (
                          <Square size={20} className={styles.checkboxIcon} />
                        )}
                      </div>
                    </TableHeader>
                  )}
                  <TableHeader>Öğrenci No</TableHeader>
                  <TableHeader>Ad Soyad</TableHeader>
                  <TableHeader>Sınıf</TableHeader>
                  <TableHeader>Durum</TableHeader>
                  <TableHeader style={{ textAlign: 'right' }}>İşlemler</TableHeader>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 6 : 5} style={{ textAlign: 'center', padding: '2rem' }}>
                      Kayıt bulunamadı.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((s: any) => {
                    const isSelected = selectedIds.includes(s.id);
                    return (
                      <TableRow key={s.id} className={`${s.isActive ? styles.activeRow : styles.passiveRow} ${isSelected ? styles.selectedRow : ''}`}>
                        {isAdmin && (
                          <TableCell className={styles.checkboxCell}>
                            <div onClick={() => toggleSelect(s.id)} style={{ cursor: 'pointer' }}>
                              {isSelected ? (
                                <CheckSquare size={20} className={styles.checkboxIconActive} />
                              ) : (
                                <Square size={20} className={styles.checkboxIcon} />
                              )}
                            </div>
                          </TableCell>
                        )}
                        <TableCell><strong>{s.studentNo}</strong></TableCell>
                        <TableCell>
                          <Link href={`/ogrenciler/${s.id}`} style={{ color: 'var(--primary)', fontWeight: '500' }}>
                            {s.fullName}
                          </Link>
                        </TableCell>
                        <TableCell>{s.class?.name}</TableCell>
                        <TableCell>
                          <Badge variant={s.isActive ? 'success' : 'danger'}>
                            {s.isActive ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={styles.actionButtons}>
                            {isAdmin && (
                              <>
                                <Button variant="secondary" size="sm" onClick={() => openModal(s)} title="Düzenle">
                                  <Edit size={16} />
                                </Button>
                                <Button 
                                  variant={s.isActive ? 'danger' : 'success'} 
                                  size="sm" 
                                  onClick={() => handleToggleStatus(s.id, s.isActive)}
                                  title={s.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                                >
                                  {s.isActive ? <PowerOff size={16} /> : <Power size={16} />}
                                </Button>
                                <Button 
                                  variant="danger" 
                                  size="sm" 
                                  onClick={() => handleDeleteSingle(s.id, s.fullName)}
                                  title="Sil"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      {/* Modals remain the same */}
      {isAdmin && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={editStudent ? 'Öğrenci Düzenle' : 'Yeni Öğrenci Ekle'}
        >
          <form onSubmit={handleSubmit} className={styles.formGrid}>
            <div className={styles.formFull}>
              <Input label="Ad Soyad" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
            </div>
            <div>
              <Input label="Öğrenci No (Benzersiz)" required value={formData.studentNo} onChange={e => setFormData({...formData, studentNo: e.target.value})} />
            </div>
            <div>
              <Select label="Sınıf" required value={formData.classId} onChange={e => setFormData({...formData, classId: e.target.value})}>
                <option value="" disabled>Seçiniz</option>
                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className={styles.formFull}>
              <Select label="Seviye" required value={formData.levelId} onChange={e => setFormData({...formData, levelId: e.target.value})}>
                <option value="" disabled>Seçiniz</option>
                {levels.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </div>
            <div>
              <Input label="Veli Adı (Opsiyonel)" value={formData.parentName} onChange={e => setFormData({...formData, parentName: e.target.value})} />
            </div>
            <div>
              <Input label="Veli Telefon (Opsiyonel)" value={formData.parentPhone} onChange={e => setFormData({...formData, parentPhone: e.target.value})} />
            </div>
            <div className={styles.formFull} style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>İptal</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Kaydediliyor...' : 'Kaydet'}</Button>
            </div>
          </form>
        </Modal>
      )}

      {isAdmin && (
        <Modal 
          isOpen={isBulkModalOpen} 
          onClose={() => setIsBulkModalOpen(false)} 
          title="Toplu Öğrenci İçe Aktar"
        >
          <div className={styles.importOptions}>
            <div className={styles.templateSection}>
              <div className={styles.templateInfo}>
                <FileSpreadsheet size={24} color="var(--primary)" />
                <div>
                  <strong>Excel Taslağı Kullanın</strong>
                  <p>Hata almamak için önceden hazırlanmış şablonu kullanmanızı öneririz.</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={downloadStudentTemplate}>
                <Download size={16} /> Taslağı İndir (.xlsx)
              </Button>
            </div>

            <hr className={styles.divider} />

            <form onSubmit={handleBulkSubmit} className={styles.importForm}>
              <div className={styles.uploadArea}>
                <label className={styles.fileLabel}>
                  <Upload size={20} />
                  <span>{excelFile ? excelFile.name : 'Excel Dosyası Seçin veya Sürükleyin'}</span>
                  <input 
                    type="file" 
                    accept=".xlsx, .xls" 
                    onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                    className={styles.fileInput}
                  />
                </label>
              </div>

              <div className={styles.orText}>VEYA</div>

              <textarea
                className={styles.csvTextArea}
                value={csvText}
                onChange={(e) => { setCsvText(e.target.value); setExcelFile(null); }}
                placeholder="Örnek: Ahmet Yılmaz, 1054, 9-A, Lise Seviyesi"
              />
              <p className={styles.helpText}>Kopyala-yapıştır ile hızlı ekleme yapabilirsiniz (Virgülle ayrılmış format).</p>

              <div className={styles.modalActions}>
                <Button type="button" variant="secondary" onClick={() => setIsBulkModalOpen(false)}>İptal</Button>
                <Button type="submit" disabled={loading || (!excelFile && !csvText.trim())}>
                  {loading ? 'İşleniyor...' : 'Öğrencileri Aktar'}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </>
  );
}
