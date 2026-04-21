'use server';

import { prisma } from '@/lib/db';
import { checkRole, hasAdminPrivileges, isVIPAdmin } from '@/lib/auth';
import { getUserContext } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';

export async function getSettingsData() {
  const user = await getUserContext();
  if (!user) return { classes: [], levels: [], prayerTimes: [] };

  const [classes, levels, prayerTimes, categories] = await Promise.all([
    prisma.class.findMany({ 
      where: { institutionId: user.institutionId },
      include: { category: true },
      orderBy: { sortOrder: 'asc' } 
    }),
    prisma.level.findMany({ 
      where: { institutionId: user.institutionId },
      include: { category: true },
      orderBy: { sortOrder: 'asc' } 
    }),
    prisma.prayerTime.findMany({ 
      where: { institutionId: user.institutionId },
      include: { excludedClasses: true },
      orderBy: { sortOrder: 'asc' } 
    }),
    prisma.category.findMany({
      where: { institutionId: user.institutionId },
      orderBy: { sortOrder: 'asc' }
    })
  ]);
  return { classes, levels, prayerTimes, categories };
}

export async function saveSetting(type: 'class' | 'level' | 'prayerTime' | 'category', data: any) {
  const user = await getUserContext();
  if (!user || !hasAdminPrivileges(user)) return { error: 'Yetkisiz işlem.' };

  try {
    if (data.id) {
      if (type === 'prayerTime') {
        await prisma.prayerTime.update({
          where: { id: data.id, institutionId: user.institutionId },
          data: { 
            name: data.name, 
            sortOrder: parseInt(data.sortOrder), 
            isActive: data.isActive,
            activeDays: data.activeDays,
            startTime: data.startTime || null,
            endTime: data.endTime || null,
            excludedClasses: {
              set: data.excludedClassIds?.map((id: string) => ({ id })) || []
            }
          }
        });
      } else if (type === 'class') {
        await prisma.class.update({
          where: { id: data.id, institutionId: user.institutionId },
          data: { 
            name: data.name, 
            sortOrder: parseInt(data.sortOrder), 
            isActive: data.isActive,
            categoryId: data.categoryId || null
          }
        });
      } else if (type === 'level') {
        await prisma.level.update({
          where: { id: data.id, institutionId: user.institutionId },
          data: { 
            name: data.name, 
            sortOrder: parseInt(data.sortOrder), 
            isActive: data.isActive,
            categoryId: data.categoryId || null
          }
        });
      } else {
        await prisma.category.update({
          where: { id: data.id, institutionId: user.institutionId },
          data: { name: data.name, sortOrder: parseInt(data.sortOrder) }
        });
      }
    } else {
      if (type === 'prayerTime') {
        await prisma.prayerTime.create({
          data: { 
            name: data.name, 
            sortOrder: parseInt(data.sortOrder), 
            isActive: data.isActive,
            activeDays: data.activeDays,
            startTime: data.startTime || null,
            endTime: data.endTime || null,
            institutionId: user.institutionId,
            excludedClasses: {
              connect: data.excludedClassIds?.map((id: string) => ({ id })) || []
            }
          }
        });
      } else if (type === 'class') {
        await prisma.class.create({
          data: { 
            name: data.name, 
            sortOrder: parseInt(data.sortOrder), 
            isActive: data.isActive, 
            institutionId: user.institutionId,
            categoryId: data.categoryId || null
          }
        });
      } else if (type === 'level') {
        await prisma.level.create({
          data: { 
            name: data.name, 
            sortOrder: parseInt(data.sortOrder), 
            isActive: data.isActive, 
            institutionId: user.institutionId,
            categoryId: data.categoryId || null
          }
        });
      } else {
        await prisma.category.create({
          data: { name: data.name, sortOrder: parseInt(data.sortOrder), institutionId: user.institutionId }
        });
      }
    }
    
    revalidatePath(`/yonetim/siniflar`);
    revalidatePath(`/yonetim/seviyeler`);
    revalidatePath(`/yonetim/vakitler`);
    revalidatePath(`/yonetim/kategoriler`);
    return { success: true };
  } catch (error) {
    console.error('Save setting error:', error);
    return { error: 'Kaydetme işlemi başarısız. Aynı isimde bir kayıt zaten olabilir.' };
  }
}

export async function toggleSettingStatus(type: 'class' | 'level' | 'prayerTime' | 'category', id: string, currentStatus: boolean) {
  const user = await getUserContext();
  if (!user || !hasAdminPrivileges(user)) return { error: 'Yetkisiz işlem.' };

  try {
    if (type === 'class') {
      await prisma.class.update({ where: { id, institutionId: user.institutionId }, data: { isActive: !currentStatus } });
    } else if (type === 'level') {
      await prisma.level.update({ where: { id, institutionId: user.institutionId }, data: { isActive: !currentStatus } });
    } else if (type === 'prayerTime') {
      await prisma.prayerTime.update({ where: { id, institutionId: user.institutionId }, data: { isActive: !currentStatus } });
    } else {
      await prisma.category.update({ where: { id, institutionId: user.institutionId }, data: { isActive: !currentStatus } });
    }

    revalidatePath(`/yonetim/siniflar`);
    revalidatePath(`/yonetim/seviyeler`);
    revalidatePath(`/yonetim/vakitler`);
    return { success: true };
  } catch (error) {
    return { error: 'Durum güncellenirken hata oluştu.' };
  }
}

export async function deleteSetting(type: 'class' | 'level' | 'prayerTime' | 'category', id: string) {
  const user = await getUserContext();
  if (!user || !hasAdminPrivileges(user)) return { error: 'Yetkisiz işlem.' };

  try {
    if (type === 'class') {
      await prisma.class.delete({ where: { id, institutionId: user.institutionId } });
    } else if (type === 'level') {
      await prisma.level.delete({ where: { id, institutionId: user.institutionId } });
    } else if (type === 'prayerTime') {
      await prisma.prayerTime.delete({ where: { id, institutionId: user.institutionId } });
    } else {
      await prisma.category.delete({ where: { id, institutionId: user.institutionId } });
    }

    revalidatePath(`/yonetim/siniflar`);
    revalidatePath(`/yonetim/seviyeler`);
    revalidatePath(`/yonetim/vakitler`);
    revalidatePath(`/yonetim/kategoriler`);
    return { success: true };
  } catch (error) {
    console.error('Delete setting error:', error);
    return { error: 'Silme işlemi başarısız. Bu kayda bağlı öğrenciler veya yoklama kayıtları olabilir.' };
  }
}

export async function initDefaultCategories() {
  const user = await getUserContext();
  if (!user || user.username !== 'admin') return { error: 'Yetkisiz.' };

  const categories = [
    { name: 'Ortaokul', sortOrder: 1 },
    { name: 'Lise', sortOrder: 2 }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name_institutionId: { name: cat.name, institutionId: user.institutionId } },
      update: {},
      create: { 
        name: cat.name, 
        sortOrder: cat.sortOrder, 
        institutionId: user.institutionId 
      }
    });
  }

  revalidatePath('/yonetim/kategoriler');
  return { success: true };
}
