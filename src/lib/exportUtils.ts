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

interface PDFOptions {
  institutionName?: string;
  institutionLogo?: string | null;
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
    startY: currentY + 15,
    head: [tableColumn],
    body: tableRows,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    styles: { fontSize: 9, font: 'helvetica' },
  });

  doc.save(`${fileName}.pdf`);
};
