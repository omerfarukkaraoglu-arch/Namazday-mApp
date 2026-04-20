'use server';

import { prisma } from '@/lib/db';
import { getUserContext } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';

export async function getStudents() {
  const user = await getUserContext();
  if (!user) return [];

  return await prisma.student.findMany({
    where: { institutionId: user.institutionId },
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
  studentNo: string;
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
          studentNo: data.studentNo,
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
          studentNo: data.studentNo,
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
    return { error: 'Öğrenci kaydedilirken beklenmeyen bir hata oluştu. (Numara daha önce kullanılmış olabilir)' };
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
      if (parts.length < 4) {
        errorCount++;
        continue;
      }

      const [fullName, studentNo, className, levelName] = parts;

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

      await prisma.student.upsert({
        where: { studentNo_institutionId: { studentNo, institutionId: user.institutionId } },
        update: {
          fullName,
          classId: classRecord.id,
          levelId: levelRecord.id,
          isActive: true
        },
        create: {
          fullName,
          studentNo,
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
