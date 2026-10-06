'use server';

import { prisma } from '@/lib/db';
import { checkRole, isVIPAdmin, isSystemAdmin, hasAdminPrivileges } from '@/lib/auth';
import { getUserContext } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';

export async function getOwnInstitution() {
  const user = await getUserContext();
  if (!user) return null;

  return await prisma.institution.findUnique({
    where: { id: user.institutionId }
  });
}

export async function getInstitutions() {
  const user = await getUserContext();
  if (!user || !isSystemAdmin(user)) {
    return [];
  }

  return await prisma.institution.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: {
          users: true,
          students: true
        }
      }
    }
  });
}

export async function createInstitution(data: { name: string }) {
  const user = await getUserContext();
  if (!user || (!checkRole(user.role, 'SYSTEM_ADMIN') && !isVIPAdmin(user))) {
    return { error: 'Yetkisiz işlem.' };
  }

  try {
    const institution = await prisma.institution.create({
      data: {
        name: data.name,
        isActive: true
      }
    });

    revalidatePath('/yonetim/kurumlar');
    return { success: true, institution };
  } catch (error) {
    console.error('Create institution error:', error);
    return { error: 'Kurum oluşturulurken bir hata oluştu. Aynı isimde bir kurum olabilir.' };
  }
}

export async function toggleInstitutionStatus(id: string, currentStatus: boolean) {
  const user = await getUserContext();
  if (!user || (!checkRole(user.role, 'SYSTEM_ADMIN') && !isVIPAdmin(user))) {
    return { error: 'Yetkisiz işlem.' };
  }

  try {
    await prisma.institution.update({
      where: { id },
      data: { isActive: !currentStatus }
    });
    revalidatePath('/yonetim/kurumlar');
    return { success: true };
  } catch (error) {
    return { error: 'Durum güncellenirken hata oluştu.' };
  }
}

export async function updateInstitution(id: string, data: { name?: string, logo?: string | null }) {
  const user = await getUserContext();
  if (!user) return { error: 'Oturum açılmadı.' };

  // Permission check: System Admin can update anything, Institution Admin can only update their own
  const isSysAdmin = isSystemAdmin(user);
  const isOwnInstitution = user.institutionId === id;
  const isInstAdmin = checkRole(user.role, 'SUPER_ADMIN') || checkRole(user.role, 'ADMIN') || checkRole(user.role, 'admin');

  if (!isSysAdmin && !(isInstAdmin && isOwnInstitution)) {
    return { error: 'Bu kurumu güncelleme yetkiniz yok.' };
  }

  try {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    // Explicitly allow null to remove the logo
    if (data.logo !== undefined) updateData.logo = data.logo;

    await prisma.institution.update({
      where: { id },
      data: updateData
    });

    revalidatePath('/yonetim/kurumlar');
    revalidatePath('/yonetim/ayarlar/kurum');
    revalidatePath('/', 'layout'); // Update logo in sidebar globally
    
    return { success: true };
  } catch (error) {
    console.error('Update institution error:', error);
    return { error: 'Güncelleme sırasında bir hata oluştu.' };
  }
}

export async function deleteInstitution(id: string) {
  const user = await getUserContext();
  if (!user || (!checkRole(user.role, 'SYSTEM_ADMIN') && !isVIPAdmin(user))) {
    return { error: 'Yetkisiz işlem. Kurumları sadece Süper Admin silebilir.' };
  }

  if (user.institutionId === id) {
    return { error: 'Aktif olarak bağlı olduğunuz kendi kurumunuzu silemezsiniz.' };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Yoklamalar
      await tx.attendance.deleteMany({ where: { institutionId: id } });
      // 2. Bildirimler
      await tx.notification.deleteMany({ where: { institutionId: id } });
      // 3. Öğrenciler
      await tx.student.deleteMany({ where: { institutionId: id } });
      // 4. Kullanıcılar
      await tx.user.deleteMany({ where: { institutionId: id } });
      // 5. Sınıflar
      await tx.class.deleteMany({ where: { institutionId: id } });
      // 6. Kademeler
      await tx.level.deleteMany({ where: { institutionId: id } });
      // 7. Kategoriler
      await tx.category.deleteMany({ where: { institutionId: id } });
      // 8. Vakitler
      await tx.prayerTime.deleteMany({ where: { institutionId: id } });
      // 9. Kurum
      await tx.institution.delete({ where: { id } });
    });

    revalidatePath('/yonetim/kurumlar');
    revalidatePath('/yonetim/ayarlar/kurum');
    revalidatePath('/', 'layout');

    return { success: true };
  } catch (error) {
    console.error('Delete institution error:', error);
    return { error: 'Kurum ve bağlı verileri silinirken bir hata oluştu.' };
  }
}
