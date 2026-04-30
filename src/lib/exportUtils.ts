'use client';

import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { GEIST_REGULAR_BASE64 } from './fontData';

const formatTRDate = (date: Date | string | null) => {
  if (!date) return '-';
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split('-');
    return `${d}.${m}.${y}`;
  }
  const d = new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

const STATUS_LABELS: Record<string, string> = {
  'VAR': 'VAR',
  'YOK': 'YOK',
  'GEC': 'GEÇ',
  'IZINLI': 'İZİNLİ',
  'GOREVLI': 'GÖREVLİ'
};

// Excel Export
export const exportToExcel = (data: any[], fileName: string) => {
  const worksheetData = data.map(record => ({
    'Tarih': formatTRDate(record.date),
    'Ad Soyad': record.student.fullName,
    'Sınıf': record.student.class?.name || '-',
    'Vakit': record.prayerTime.name,
    'Durum': STATUS_LABELS[record.status] || record.status
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
  
  // Register and set custom font for Turkish support
  try {
    doc.addFileToVFS('Geist-Regular.ttf', GEIST_REGULAR_BASE64);
    doc.addFont('Geist-Regular.ttf', 'Geist', 'normal');
    doc.setFont('Geist');
  } catch (e) {
    console.error('Font load error:', e);
  }

  const trFix = (str: string) => {
    return str || '';
  };

  let currentY = 20;

  // Render Institution Header
  if (options?.institutionLogo) {
    try {
      doc.addImage(options.institutionLogo, 'PNG', 14, 10, 18, 18);
    } catch (e) {
      console.error('PDF Logo render error:', e);
    }
  }
  
  doc.setFontSize(22);
  doc.setTextColor(30, 58, 95); // Deep Sapphire
  doc.setFont('Geist', 'bold');
  doc.text(trFix(options?.institutionName || 'NAMAZDAYIM'), options?.institutionLogo ? 36 : 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.setFont('Geist', 'normal');
  doc.text(trFix('Yoklama Takip ve Analiz Sistemi'), options?.institutionLogo ? 36 : 14, 28);
  
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 35, 196, 35);
  
  currentY = 45;
  
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.setFont('Geist', 'bold');
  doc.text(trFix(title), 14, currentY);
  
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.setFont('Geist', 'normal');
  doc.text(trFix(`Rapor Oluşturulma: ${formatTRDate(new Date())}`), 14, currentY + 7);
  
  currentY += 20;

  // Render Summary Card if exists (Premium Style)
  if (options?.summary) {
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, currentY, 182, 38, 3, 3, 'F');
    doc.setDrawColor(30, 58, 95);
    doc.setLineWidth(0.5);
    doc.line(14, currentY, 14, currentY + 38);
    
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.setFont('Geist', 'bold');
    doc.text(trFix('GENEL DEĞERLENDİRME ÖZETİ'), 20, currentY + 10);
    
    doc.setFontSize(12);
    doc.setTextColor(231, 76, 60);
    doc.text(trFix(`Toplam: ${options.summary.totalAbsent} Vakit Devamsızlık`), 20, currentY + 18);
    
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.setFont('Geist', 'normal');
    const prayerSummary = options.summary.byPrayer.map(p => `${p.name}: ${p.count}`).join('  |  ');
    doc.text(trFix(prayerSummary), 20, currentY + 26);

    const recentMissed = options.summary.missedDates.slice(0, 4).map(m => `${m.date} ${m.prayer}`).join(', ');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(trFix(`Son Kayıtlar: ${recentMissed}...`), 20, currentY + 33);
    
    currentY += 50;
  }

  const tableRows = data.map(record => [
    formatTRDate(record.date),
    trFix(record.student.fullName),
    trFix(record.student.class?.name || '-'),
    trFix(record.prayerTime.name),
    trFix(STATUS_LABELS[record.status] || record.status)
  ]);

  const tableColumn = ["Tarih", "Ad Soyad", "Sınıf", "Vakit", "Durum"].map(h => trFix(h));

  autoTable(doc, {
    startY: currentY,
    head: [tableColumn],
    body: tableRows,
    theme: 'striped',
    headStyles: { 
      fillColor: [30, 58, 95], 
      textColor: 255, 
      fontStyle: 'bold',
      font: 'Geist',
      halign: 'center'
    },
    bodyStyles: { 
      fontSize: 9, 
      font: 'Geist',
      textColor: [51, 65, 85]
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 25 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 30 },
      4: { halign: 'center', cellWidth: 30 }
    },
    margin: { top: 20 },
    didDrawPage: (data) => {
      // Footer
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        trFix('Bu rapor Namazdayım Akıllı Takip Sistemi tarafından otomatik oluşturulmuştur.'), 
        14, 
        pageHeight - 10
      );
      doc.text(
        trFix(`Sayfa ${data.pageNumber}`), 
        pageSize.width - 25, 
        pageHeight - 10
      );
    }
  });

  doc.save(`${fileName}.pdf`);
};
