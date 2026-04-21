'use server';

import { prisma } from '@/lib/db';
import { hasAdminPrivileges, checkRole, isSystemAdmin as checkSystemAdmin } from '@/lib/auth';
import { getUserContext } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcrypt';

export async function getUsers() {
  const currentUser = await getUserContext();
  if (!currentUser || !hasAdminPrivileges(currentUser)) {
    return [];
  }

  // SYSTEM_ADMIN her şeyi görür, diğerleri sadece kendi kurumunu
  const isSystemAdmin = checkSystemAdmin(currentUser);

  const whereClause = isSystemAdmin ? {} : { institutionId: currentUser.institutionId };

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      isActive: true,
      createdAt: true,
      institutionId: true,
      institution: {
        select: { name: true }
      },
      assignedClassId: true,
      assignedLevelId: true,
      assignedClass: { select: { name: true } },
      assignedLevel: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  return users;
}

export async function createOrUpdateUser(data: {
  id?: string;
  username: string;
  displayName: string;
  password?: string;
  role: string;
  institutionId?: string; // SYSTEM_ADMIN tarafından set edilebilir
  assignedClassId?: string | null;
  assignedLevelId?: string | null;
}) {
  const currentUser = await getUserContext();
  if (!currentUser || !hasAdminPrivileges(currentUser)) {
    return { error: 'Yetkisiz işlem.' };
  }

  const isSystemAdmin = checkRole(currentUser.role, 'SYSTEM_ADMIN') || currentUser.username === 'admin';
  
  // Eğer admin ise ve bir kurum Id'si seçilmemişse kendi kurumunu kullan
  const targetInstitutionId = (isSystemAdmin && data.institutionId) 
    ? data.institutionId 
    : currentUser.institutionId;

  try {
    if (data.id) {
      const updateData: any = {
        displayName: data.displayName,
        role: data.role,
        assignedClassId: data.assignedClassId,
        assignedLevelId: data.assignedLevelId
      };

      // Sistem admini ise kurum değiştirmesine de izin veriyoruz
      if (isSystemAdmin && data.institutionId) {
        updateData.institutionId = data.institutionId;
      }

      if (data.password && data.password.trim() !== '') {
        updateData.passwordHash = await bcrypt.hash(data.password, 10);
      }

      await prisma.user.update({
        where: { 
          id: data.id, 
          // Eğer sistem admini değilse sadece kendi kurumundaki kullanıcıyı güncelleyebilir
          institutionId: isSystemAdmin ? undefined : currentUser.institutionId 
        },
        data: updateData
      });
    } else {
      if (!data.password) return { error: 'Yeni kullanıcı için şifre zorunludur.' };
      
      const passwordHash = await bcrypt.hash(data.password, 10);
      
      await prisma.user.create({
        data: {
          username: data.username,
          displayName: data.displayName,
          role: data.role,
          passwordHash,
          isActive: true,
          institutionId: targetInstitutionId,
          assignedClassId: data.assignedClassId,
          assignedLevelId: data.assignedLevelId
        }
      });
    }

    revalidatePath('/yonetim/kullanicilar');
    return { success: true };
  } catch (error) {
    console.error('User save error:', error);
    return { error: 'Kullanıcı kaydedilirken hata oluştu. (Kullanıcı adı benzersiz olmalıdır)' };
  }
}

export async function toggleUserStatus(id: string, currentStatus: boolean) {
  const currentUser = await getUserContext();
  if (!currentUser || !hasAdminPrivileges(currentUser)) {
    return { error: 'Yetkisiz işlem.' };
  }

  if (currentUser.id === id) {
    return { error: 'Kendi hesabınızı pasif yapamazsınız!' };
  }

  const isSystemAdmin = checkRole(currentUser.role, 'SYSTEM_ADMIN') || currentUser.username === 'admin';

  try {
    await prisma.user.update({
      where: { 
        id: id, 
        institutionId: isSystemAdmin ? undefined : currentUser.institutionId 
      },
      data: { isActive: !currentStatus }
    });
    revalidatePath('/yonetim/kullanicilar');
    return { success: true };
  } catch (error) {
    return { error: 'İşlem başarısız.' };
  }
}

export async function deleteUser(id: string) {
  const currentUser = await getUserContext();
  if (!currentUser || !hasAdminPrivileges(currentUser)) {
    return { error: 'Yetkisiz işlem.' };
  }

  if (currentUser.id === id) {
    return { error: 'Kendi hesabınızı silemezsiniz!' };
  }

  const isSystemAdmin = checkRole(currentUser.role, 'SYSTEM_ADMIN') || currentUser.username === 'admin';

  try {
    await prisma.user.delete({
      where: { 
        id: id, 
        institutionId: isSystemAdmin ? undefined : currentUser.institutionId 
      }
    });
    revalidatePath('/yonetim/kullanicilar');
    return { success: true };
  } catch (error) {
    console.error('User delete error:', error);
    return { error: 'Kullanıcı silinirken bir hata oluştu. (Aktif kayıtları/yoklamaları olabilir)' };
  }
}

export async function resetUserPassword(id: string, newPassword: string) {
  const currentUser = await getUserContext();
  if (!currentUser || !hasAdminPrivileges(currentUser)) {
    return { error: 'Yetkisiz işlem.' };
  }

  const isSystemAdmin = checkRole(currentUser.role, 'SYSTEM_ADMIN') || currentUser.username === 'admin';

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { 
        id: id, 
        institutionId: isSystemAdmin ? undefined : currentUser.institutionId 
      },
      data: { passwordHash }
    });
    
    return { success: true };
  } catch (error) {
    return { error: 'Şifre sıfırlanırken bir hata oluştu.' };
  }
}
