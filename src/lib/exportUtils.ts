'use client';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Excel Export
export const exportToExcel = (data: any[], fileName: string) => {
  const worksheetData = data.map(record => ({
    'Tarih': new Intl.DateTimeFormat('tr-TR').format(new Date(record.date)),
    'Öğrenci No': record.student.studentNo,
    'Ad Soyad': record.student.fullName,
    'Sınıf': record.student.class?.name || '-',
    'Vakit': record.prayerTime.name,
    'Durum': record.status
  }));

  const worksheet = XLSX.utils.json_to_sheet(worksheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Yoklama Raporu');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

export interface PDFOptions {
  institutionName?: string;
  institutionLogo?: string | null;
  summary?: {
    totalAbsent: number;
    byPrayer: { name: string, count: number }[];
    missedDates: { date: string, prayer: string }[];
  } | null;
}

// PDF Export with Turkish Font Support (Latinization Fallback for Clean Output)
export const exportToPDF = (data: any[], fileName: string, title: string, options?: PDFOptions) => {
  const doc = new jsPDF();

  const trFix = (str: string) => {
    if (!str) return '';
    const charMap: any = { 'İ': 'I', 'ı': 'i', 'Ş': 'S', 'ş': 's', 'Ğ': 'G', 'ğ': 'g', 'Ü': 'U', 'ü': 'u', 'Ö': 'O', 'ö': 'o', 'Ç': 'C', 'ç': 'c' };
    let fixed = str;
    Object.keys(charMap).forEach(key => {
      fixed = fixed.replace(new RegExp(key, 'g'), charMap[key]);
    });
    return fixed;
  };

  let currentY = 20;

  // Render Institution Header
  if (options?.institutionLogo) {
    try {
      doc.addImage(options.institutionLogo, 'PNG', 14, 10, 20, 20);
      doc.setFontSize(18);
      doc.setTextColor(41, 128, 185);
      doc.text(trFix(options.institutionName || 'Namazdayim'), 38, 22);
      currentY = 40;
    } catch (e) {
      console.error('PDF Logo render error:', e);
      doc.setFontSize(16);
      doc.text(trFix(options.institutionName || 'Namazdayim Takip Sistemi'), 14, 20);
      currentY = 30;
    }
  } else {
    doc.setFontSize(16);
    doc.text(trFix(options?.institutionName || 'Namazdayim Takip Sistemi'), 14, 20);
    currentY = 30;
  }
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(trFix(title), 14, currentY);
  doc.text(trFix(`Rapor Tarihi: ${new Intl.DateTimeFormat('tr-TR').format(new Date())}`), 14, currentY + 8);
  currentY += 15;

  // Render Summary Card if exists
  if (options?.summary) {
    doc.setDrawColor(231, 76, 60);
    doc.setLineWidth(0.5);
    doc.rect(14, currentY, 182, 35);
    
    doc.setFontSize(10);
    doc.setTextColor(44, 62, 80);
    doc.setFont('helvetica', 'bold');
    doc.text(trFix('DEVAMSIZLIK OZETI'), 20, currentY + 8);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(231, 76, 60);
    doc.text(trFix(`Toplam: ${options.summary.totalAbsent} Vakit`), 20, currentY + 16);
    
    doc.setTextColor(44, 62, 80);
    const prayerSummary = options.summary.byPrayer.map(p => `${p.name}: ${p.count}`).join(' | ');
    doc.text(trFix(prayerSummary), 20, currentY + 24);

    const recentMissed = options.summary.missedDates.slice(0, 5).map(m => `${m.date} ${m.prayer}`).join(', ');
    doc.setFontSize(8);
    doc.text(trFix(`Ornek Tarihler: ${recentMissed}`), 20, currentY + 31);
    
    currentY += 45;
  }

  const tableRows = data.map(record => [
    new Intl.DateTimeFormat('tr-TR').format(new Date(record.date)),
    record.student.studentNo,
    trFix(record.student.fullName),
    trFix(record.student.class?.name || '-'),
    trFix(record.prayerTime.name),
    trFix(record.status)
  ]);

  const tableColumn = ["Tarih", "No", "Ad Soyad", "Sinif", "Vakit", "Durum"];

  autoTable(doc, {
    startY: currentY,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 9, font: 'helvetica' },
  });

  doc.save(`${fileName}.pdf`);
};
