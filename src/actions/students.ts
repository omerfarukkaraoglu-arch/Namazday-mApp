'use server';

import { prisma } from '@/lib/db';
import { getUserContext } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';

export async function getStudents() {
  const user = await getUserContext();
  if (!user) return [];

  // Kullanıcının atamalarını veritabanından güncel halini çekelim
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { assignedClassId: true, assignedLevelId: true }
  });

  const whereClause: any = { 
    institutionId: user.institutionId,
    isActive: true 
  };

  // Eğer atama varsa OR mantığıyla filtreleyelim
  if (dbUser && (dbUser.assignedClassId || dbUser.assignedLevelId)) {
    whereClause.OR = [];
    if (dbUser.assignedClassId) {
      whereClause.OR.push({ classId: dbUser.assignedClassId });
    }
    if (dbUser.assignedLevelId) {
      whereClause.OR.push({ levelId: dbUser.assignedLevelId });
    }
  }

  return await prisma.student.findMany({
    where: whereClause,
    include: {
      class: true,
      level: true,
    },
    orderBy: [
      { class: { sortOrder: 'asc' } },
      { fullName: 'asc' }
    ]
  });
}

export async function getClassesAndLevels() {
  const user = await getUserContext();
  if (!user) return { classes: [], levels: [] };

  const classes = await prisma.class.findMany({ 
    where: { institutionId: user.institutionId },
    orderBy: { sortOrder: 'asc' } 
  });
  const levels = await prisma.level.findMany({ 
    where: { institutionId: user.institutionId },
    orderBy: { sortOrder: 'asc' } 
  });
  return { classes, levels };
}

export async function createOrUpdateStudent(data: {
  id?: string;
  fullName: string;
  classId: string;
  levelId: string;
  parentName?: string;
  parentPhone?: string;
}) {
  const user = await getUserContext();
  if (!user || (!['SUPER_ADMIN', 'SYSTEM_ADMIN', 'admin'].includes(user.role.toUpperCase()))) {
    return { error: 'Sadece yetkili yöneticiler öğrenci ekleyebilir veya düzenleyebilir.' };
  }

  try {
    if (data.id) {
      await prisma.student.update({
        where: { id: data.id, institutionId: user.institutionId },
        data: {
          fullName: data.fullName,
          classId: data.classId,
          levelId: data.levelId,
          parentName: data.parentName || null,
          parentPhone: data.parentPhone || null,
        }
      });
    } else {
      await prisma.student.create({
        data: {
          fullName: data.fullName,
          classId: data.classId,
          levelId: data.levelId,
          parentName: data.parentName || null,
          parentPhone: data.parentPhone || null,
          isActive: true,
          institutionId: user.institutionId
        }
      });
    }

    revalidatePath('/ogrenciler');
    return { success: true };
  } catch (error) {
    console.error('Save student error:', error);
    return { error: 'Öğrenci kaydedilirken beklenmeyen bir hata oluştu.' };
  }
}

export async function toggleStudentStatus(id: string, currentStatus: boolean) {
  const user = await getUserContext();
  if (!user || (!['SUPER_ADMIN', 'SYSTEM_ADMIN', 'admin'].includes(user.role.toUpperCase()))) {
    return { error: 'Yetkisiz işlem.' };
  }

  try {
    await prisma.student.update({
      where: { id: id, institutionId: user.institutionId },
      data: { isActive: !currentStatus }
    });
    revalidatePath('/ogrenciler');
    return { success: true };
  } catch (error) {
    return { error: 'Durum güncellenirken hata oluştu.' };
  }
}

export async function bulkImportStudents(csvText: string) {
  const user = await getUserContext();
  if (!user || (!['SUPER_ADMIN', 'SYSTEM_ADMIN', 'admin'].includes(user.role.toUpperCase()))) {
    return { error: 'Yetkisiz işlem.' };
  }

  try {
    const lines = csvText.trim().split('\n');
    let successCount = 0;
    let errorCount = 0;

    for (const line of lines) {
      if (!line.trim()) continue;
      
      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 3) {
        errorCount++;
        continue;
      }

      const [fullName, className, levelName] = parts;

      const classRecord = await prisma.class.upsert({
        where: { name_institutionId: { name: className, institutionId: user.institutionId } },
        update: {},
        create: { name: className, sortOrder: 99, institutionId: user.institutionId }
      });

      const levelRecord = await prisma.level.upsert({
        where: { name_institutionId: { name: levelName, institutionId: user.institutionId } },
        update: {},
        create: { name: levelName, sortOrder: 99, institutionId: user.institutionId }
      });

      // NO UNIQUE studentNo constraint, so just create new or match by name (risky)
      // For CSV we will just create to be safe
      await prisma.student.create({
        data: {
          fullName,
          classId: classRecord.id,
          levelId: levelRecord.id,
          isActive: true,
          institutionId: user.institutionId
        }
      });

      successCount++;
    }

    revalidatePath('/ogrenciler');
    return { success: true, successCount, errorCount };
  } catch (error) {
    console.error('Bulk import error:', error);
    return { error: 'Toplu ekleme sırasında beklemeyen bir hata oluştu.' };
  }
}

export async function getStudentDetails(id: string) {
  const user = await getUserContext();
  if (!user) return null;

  return await prisma.student.findFirst({
    where: { id: id, institutionId: user.institutionId },
    include: {
      class: true,
      level: true,
      attendances: {
        where: { institutionId: user.institutionId },
        include: {
          prayerTime: true
        },
        orderBy: {
          date: 'desc'
        },
        take: 50
      }
    }
  });
}

export async function deleteStudents(ids: string[]) {
  const user = await getUserContext();
  if (!user || (!['SUPER_ADMIN', 'SYSTEM_ADMIN', 'admin'].includes(user.role.toUpperCase()))) {
    return { error: 'Yetkisiz işlem.' };
  }

  try {
    await prisma.student.deleteMany({
      where: { id: { in: ids }, institutionId: user.institutionId }
    });
    revalidatePath('/ogrenciler');
    return { success: true };
  } catch (error) {
    console.error('Bulk delete error:', error);
    return { error: 'Silme işlemi sırasında hata oluştu. Bazı öğrencilerin silinmesi kısıtlanmış olabilir.' };
  }
}

export async function bulkToggleStudentStatus(ids: string[], targetStatus: boolean) {
  const user = await getUserContext();
  if (!user || (!['SUPER_ADMIN', 'SYSTEM_ADMIN', 'admin'].includes(user.role.toUpperCase()))) {
    return { error: 'Yetkisiz işlem.' };
  }

  try {
    await prisma.student.updateMany({
      where: { id: { in: ids }, institutionId: user.institutionId },
      data: { isActive: targetStatus }
    });
    revalidatePath('/ogrenciler');
    return { success: true };
  } catch (error) {
    console.error('Bulk toggle error:', error);
    return { error: 'Durum güncelleme sırasında hata oluştu.' };
  }
}

export async function bulkImportStudentsFromExcel(base64Data: string) {
  const user = await getUserContext();
  if (!user || (!['SUPER_ADMIN', 'SYSTEM_ADMIN', 'admin'].includes(user.role.toUpperCase()))) {
    return { error: 'Yetkisiz işlem.' };
  }

  try {
    const buffer = Buffer.from(base64Data, 'base64');
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (data.length === 0) return { error: 'Excel dosyası boş veya okunamadı.' };

    let successCount = 0;
    let errorCount = 0;

    for (const row of data) {
      try {
        const fullName = row['Ad Soyad'] || row['ad soyad'] || row['Full Name'];
        const className = row['Sınıf'] || row['sınıf'] || row['Class'];
        const levelName = row['Seviye'] || row['seviye'] || row['Level'];
        const parentName = row['Veli Adı'] || row['veli adı'] || row['Parent Name'];
        const parentPhone = row['Veli Telefon'] || row['veli telefon'] || row['Parent Phone'];

        if (!fullName || !className || !levelName) {
          errorCount++;
          continue;
        }

        const classRecord = await prisma.class.upsert({
          where: { name_institutionId: { name: String(className), institutionId: user.institutionId } },
          update: {},
          create: { name: String(className), sortOrder: 99, institutionId: user.institutionId }
        });

        const levelRecord = await prisma.level.upsert({
          where: { name_institutionId: { name: String(levelName), institutionId: user.institutionId } },
          update: {},
          create: { name: String(levelName), sortOrder: 99, institutionId: user.institutionId }
        });

        await prisma.student.create({
          data: {
            fullName: String(fullName),
            classId: classRecord.id,
            levelId: levelRecord.id,
            parentName: parentName ? String(parentName) : null,
            parentPhone: parentPhone ? String(parentPhone) : null,
            isActive: true,
            institutionId: user.institutionId
          }
        });

        successCount++;
      } catch (err) {
        console.error('Row import error:', err, row);
        errorCount++;
      }
    }

    revalidatePath('/ogrenciler');
    return { success: true, successCount, errorCount };
  } catch (error) {
    console.error('Excel import error:', error);
    return { error: 'Excel dosyası işlenirken bir hata oluştu.' };
  }
}
