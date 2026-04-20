'use server';

import { prisma } from '@/lib/db';
import { getUserContext } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';

export async function getClassesAndLevels() {
  const user = await getUserContext();
  if (!user) return { classes: [], levels: [] };

  const [classes, levels, categories] = await Promise.all([
    prisma.class.findMany({
      where: { isActive: true, institutionId: user.institutionId },
      orderBy: { sortOrder: 'asc' }
    }),
    prisma.level.findMany({
      where: { isActive: true, institutionId: user.institutionId },
      orderBy: { sortOrder: 'asc' }
    }),
    prisma.category.findMany({
      where: { institutionId: user.institutionId },
      orderBy: { sortOrder: 'asc' }
    })
  ]);
  
  return { classes, levels, categories };
}

export async function getPrayerTimes() {
  const user = await getUserContext();
  if (!user) return [];

  return await prisma.prayerTime.findMany({
    where: { isActive: true, institutionId: user.institutionId },
    orderBy: { sortOrder: 'asc' }
  });
}

export async function getStudentsForAttendance(prayerTimeId?: string, classId?: string, levelId?: string) {
  const user = await getUserContext();
  if (!user) return [];

  const whereClause: any = { isActive: true, institutionId: user.institutionId };
  if (classId) whereClause.classId = classId;
  if (levelId) whereClause.levelId = levelId;

  // Vakit bazlı muafiyet (Exemption) filtresi
  if (prayerTimeId) {
    const prayerTime = await prisma.prayerTime.findFirst({
      where: { id: prayerTimeId, institutionId: user.institutionId },
      include: { excludedClasses: true }
    });

    if (prayerTime && prayerTime.excludedClasses.length > 0) {
      const excludedIds = prayerTime.excludedClasses.map(c => c.id);
      whereClause.classId = {
        ...(classId ? { equals: classId } : {}),
        notIn: excludedIds
      };
    }
  }

  return await prisma.student.findMany({
    where: whereClause,
    include: {
      class: true,
      level: true
    },
    orderBy: [
      { class: { sortOrder: 'asc' } },
      { fullName: 'asc' }
    ]
  });
}

export async function getDailyAttendance(date: Date, prayerTimeId: string) {
  const user = await getUserContext();
  if (!user) return [];

  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return await prisma.attendance.findMany({
    where: {
      prayerTimeId,
      institutionId: user.institutionId,
      date: {
        gte: startOfDay,
        lte: endOfDay
      }
    }
  });
}

export async function saveAttendance(data: {
  studentId: string;
  prayerTimeId: string;
  date: Date;
  status: string;
}[]) {
  const user = await getUserContext();
  if (!user) {
    return { error: 'Oturum açmanız gerekiyor' };
  }

  try {
    await prisma.$transaction(
      data.map(item => {
        return prisma.attendance.upsert({
          where: {
            studentId_prayerTimeId_date: {
              studentId: item.studentId,
              prayerTimeId: item.prayerTimeId,
              date: item.date
            }
          },
          update: {
            status: item.status,
            takenById: user.id,
            institutionId: user.institutionId
          },
          create: {
            studentId: item.studentId,
            prayerTimeId: item.prayerTimeId,
            date: item.date,
            status: item.status,
            takenById: user.id,
            institutionId: user.institutionId
          }
        });
      })
    );

    revalidatePath('/yoklama');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Save attendance error:', error);
    return { error: 'Yoklama kaydedilirken bir hata oluştu' };
  }
}
