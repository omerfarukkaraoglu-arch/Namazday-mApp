import * as XLSX from 'xlsx';

export const EXCEL_IMPORT_HEADERS = [
  'Ad Soyad',
  'Sınıf',
  'Seviye',
  'Veli Adı',
  'Veli Telefon'
];

/**
 * Generates a blank Excel template for student import
 */
export const downloadStudentTemplate = () => {
  const worksheet = XLSX.utils.aoa_to_sheet([EXCEL_IMPORT_HEADERS]);
  
  // Set column widths
  worksheet['!cols'] = [
    { wch: 25 }, // Ad Soyad
    { wch: 12 }, // Sınıf
    { wch: 20 }, // Seviye
    { wch: 20 }, // Veli Adı
    { wch: 20 }  // Veli Telefon
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Öğrenci Taslağı');
  
  XLSX.writeFile(workbook, 'namazdayim_ogrenci_aktarim_sablonu.xlsx');
};

/**
 * Converts a File object to a base64 string
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = (error) => reject(error);
  });
};
