'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { PieChart, Pie, Cell, Tooltip as PieTooltip, Legend as PieLegend, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, Legend as LineLegend } from 'recharts';
import { getReportStats } from '@/actions/reports';
import { Filter, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToExcel, exportToPDF } from '@/lib/exportUtils';
import styles from './Raporlar.module.css';

const COLORS = {
  VAR: '#27ae60',
  YOK: '#e74c3c',
  GEC: '#f39c12',
  IZINLI: '#f1c40f',
  GOREVLI: '#3498db'
};

export function ReportsClient({ 
  initialStats, 
  options, 
  branding 
}: { 
  initialStats: any; 
  options: any;
  branding: { name: string; logo?: string | null };
}) {
  const [stats, setStats] = useState(initialStats);
  const [loading, setLoading] = useState(false);
  
  // Filtre durumları
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    studentId: '',
    classId: '',
    levelId: '',
    prayerTimeId: ''
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = async () => {
    setLoading(true);
    const newStats = await getReportStats(filters);
    setStats(newStats);
    setLoading(false);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'VAR': return <Badge variant="success">VAR</Badge>;
      case 'YOK': return <Badge variant="danger">YOK</Badge>;
      case 'GEC': return <Badge variant="delay">GEÇ</Badge>;
      case 'IZINLI': return <Badge variant="warning">İZİNLİ</Badge>;
      case 'GOREVLI': return <Badge variant="info">GÖREVLİ</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const getExportTitle = () => {
    let title = 'Genel Yoklama Raporu';
    if (filters.startDate || filters.endDate) {
      title += ` (${filters.startDate || '...'} / ${filters.endDate || '...'})`;
    }
    return title;
  };

  const handleExcelExport = () => {
    exportToExcel(stats.records, `Namazdayim_Rapor_${new Date().getTime()}`);
  };

  const handlePDFExport = () => {
    exportToPDF(stats.records, `Namazdayim_Rapor_${new Date().getTime()}`, getExportTitle(), {
      institutionName: branding.name,
      institutionLogo: branding.logo
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Gelişmiş Raporlar</h1>
          <p className={styles.description}>Kriterlere göre filtreleyin, detayları analiz edin.</p>
        </div>
      </header>

      {/* Filtreleme Kartı */}
      <Card style={{ overflow: 'visible' }}>
        <CardContent>
          <div className={styles.filtersGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', display: 'grid' }}>
            <div>
              <Input label="Başlangıç" type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} />
            </div>
            <div>
              <Input label="Bitiş" type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} />
            </div>
            <div>
              <Select label="Öğrenci" value={filters.studentId} onChange={e => handleFilterChange('studentId', e.target.value)}>
                <option value="">Tümü</option>
                {options.students.map((s: any) => <option key={s.id} value={s.id}>{s.fullName} ({s.class?.name || '?'})</option>)}
              </Select>
            </div>
            <div>
              <Select label="Sınıf" value={filters.classId} onChange={e => handleFilterChange('classId', e.target.value)} disabled={!!filters.studentId}>
                <option value="">Tümü</option>
                {options.classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div>
              <Select label="Seviye" value={filters.levelId} onChange={e => handleFilterChange('levelId', e.target.value)} disabled={!!filters.studentId}>
                <option value="">Tümü</option>
                {options.levels?.map((l: any) => <option key={l.id} value={l.id}>{l.name}</option>)}
              </Select>
            </div>
            <div>
              <Select label="Vakit" value={filters.prayerTimeId} onChange={e => handleFilterChange('prayerTimeId', e.target.value)}>
                <option value="">Tümü</option>
                {options.prayerTimes.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
              <Button style={{ flex: 1, height: '42px' }} onClick={applyFilters} disabled={loading}>
                <Filter size={18} /> Filtrele
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {stats.totalRecords === 0 ? (
        <Card>
          <CardContent>
            <div className={styles.emptyState}>
              Seçili kriterlere uygun yoklama kaydı bulunamadı.
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className={styles.chartsGrid}>
            <Card>
              <CardHeader>Filtrelenmiş Dağılım</CardHeader>
              <CardContent>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                        outerRadius={90}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {stats.pieData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#95a5a6'} />
                        ))}
                      </Pie>
                      <PieTooltip />
                      <PieLegend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>Zamana Göre Trend</CardHeader>
              <CardContent>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="date" fontSize={12} tickMargin={10} />
                      <YAxis fontSize={12} allowDecimals={false} />
                      <LineTooltip />
                      <LineLegend />
                      <Line type="monotone" dataKey="VAR" stroke={COLORS.VAR} strokeWidth={2} activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="YOK" stroke={COLORS.YOK} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <CardHeader>Filtrelenmiş Kayıtlar ({stats.totalRecords} Kayıt)</CardHeader>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Button variant="secondary" size="sm" onClick={handleExcelExport} style={{ borderColor: '#27ae60', color: '#27ae60' }}>
                  <FileSpreadsheet size={16} style={{ marginRight: '4px' }} /> Excel
                </Button>
                <Button variant="secondary" size="sm" onClick={handlePDFExport} style={{ borderColor: '#e74c3c', color: '#e74c3c' }}>
                  <FileText size={16} style={{ marginRight: '4px' }} /> PDF
                </Button>
              </div>
            </div>
            <CardContent>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeader>Tarih</TableHeader>
                      <TableHeader>Öğrenci</TableHeader>
                      <TableHeader>Sınıf</TableHeader>
                      <TableHeader>Vakit</TableHeader>
                      <TableHeader>Durum</TableHeader>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.records?.map((record: any) => (
                      <TableRow key={record.id}>
                        <TableCell>{new Intl.DateTimeFormat('tr-TR', { dateStyle: 'short' }).format(new Date(record.date))}</TableCell>
                        <TableCell>
                          <strong>{record.student.studentNo}</strong> - {record.student.fullName}
                        </TableCell>
                        <TableCell>{record.student.class?.name || '-'}</TableCell>
                        <TableCell>{record.prayerTime.name}</TableCell>
                        <TableCell>{getStatusBadge(record.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
