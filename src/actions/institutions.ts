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
