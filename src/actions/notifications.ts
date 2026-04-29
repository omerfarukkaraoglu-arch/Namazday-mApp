'use server';

import { prisma } from '@/lib/db';
import { getUserContext } from '@/lib/auth-server';
import { revalidatePath } from 'next/cache';
import { sendOneSignalPush } from '@/lib/onesignal-server';

export async function getNotifications() {
  const user = await getUserContext();
  if (!user) return [];

  return await prisma.notification.findMany({
    where: {
      userId: user.id,
      institutionId: user.institutionId
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50 // Limit to last 50
  });
}

export async function getUnreadCount() {
  const user = await getUserContext();
  if (!user) return 0;

  return await prisma.notification.count({
    where: {
      userId: user.id,
      institutionId: user.institutionId,
      isRead: false
    }
  });
}

export async function markAsRead(id: string) {
  const user = await getUserContext();
  if (!user) return { error: 'Oturum açmanız gerekiyor' };

  try {
    await prisma.notification.update({
      where: { id, userId: user.id },
      data: { isRead: true }
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Mark as read error:', error);
    return { error: 'Bildirim güncellenirken bir hata oluştu' };
  }
}

export async function markAllAsRead() {
  const user = await getUserContext();
  if (!user) return { error: 'Oturum açmanız gerekiyor' };

  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, isRead: false },
      data: { isRead: true }
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Mark all as read error:', error);
    return { error: 'Bildirimler güncellenirken bir hata oluştu' };
  }
}

export async function sendNotification(data: {
  userId: string;
  title: string;
  message: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';
}) {
  const admin = await getUserContext();
  if (!admin || !['SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
    return { error: 'Yetkiniz yok' };
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { institutionId: true }
    });

    if (!targetUser) return { error: 'Kullanıcı bulunamadı' };

    // Admin sadece kendi kurumundaki birine gönderebilir (System Admin hariç)
    if (admin.role !== 'SYSTEM_ADMIN' && targetUser.institutionId !== admin.institutionId) {
      return { error: 'Başka kurumun kullanıcısına bildirim gönderemezsiniz' };
    }

    await prisma.notification.create({
      data: {
        userId: data.userId,
        institutionId: targetUser.institutionId,
        title: data.title,
        message: data.message,
        type: data.type || 'INFO'
      }
    });

    // Send OneSignal Push
    await sendOneSignalPush([data.userId], data.title, data.message);

    return { success: true };
  } catch (error) {
    console.error('Send notification error:', error);
    return { error: 'Bildirim gönderilemedi' };
  }
}

export async function broadcastToInstitution(data: {
  title: string;
  message: string;
  type?: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';
}) {
  const admin = await getUserContext();
  if (!admin || !['SYSTEM_ADMIN', 'SUPER_ADMIN'].includes(admin.role)) {
    return { error: 'Yetkiniz yok' };
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        institutionId: admin.institutionId,
        isActive: true
      },
      select: { id: true }
    });

    await prisma.notification.createMany({
      data: users.map(u => ({
        userId: u.id,
        institutionId: admin.institutionId,
        title: data.title,
        message: data.message,
        type: data.type || 'INFO'
      }))
    });

    // Send OneSignal Push
    const userIds = users.map(u => u.id);
    if (userIds.length > 0) {
      await sendOneSignalPush(userIds, data.title, data.message);
    }

    return { success: true, count: users.length };
  } catch (error) {
    console.error('Broadcast error:', error);
    return { error: 'Bildirimler gönderilemedi' };
  }
}

// Internal helper for other actions (doesn't check admin role)
export async function createInternalNotification(data: {
  userId: string;
  institutionId: string;
  title: string;
  message: string;
  type?: string;
}) {
  const notification = await prisma.notification.create({
    data: {
      userId: data.userId,
      institutionId: data.institutionId,
      title: data.title,
      message: data.message,
      type: data.type || 'INFO'
    }
  });

  // Arka planda Push gönder
  try {
    await sendOneSignalPush([data.userId], data.title, data.message);
  } catch (err) {
    console.error('Push notification error:', err);
  }

  return notification;
}

export async function deleteNotification(id: string) {
  const user = await getUserContext();
  if (!user) return { error: 'Oturum açmanız gerekiyor' };

  try {
    await prisma.notification.delete({
      where: { id, userId: user.id }
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Delete notification error:', error);
    return { error: 'Bildirim silinirken bir hata oluştu' };
  }
}

export async function deleteAllNotifications() {
  const user = await getUserContext();
  if (!user) return { error: 'Oturum açmanız gerekiyor' };

  try {
    await prisma.notification.deleteMany({
      where: { userId: user.id }
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error('Delete all notifications error:', error);
    return { error: 'Bildirimler silinirken bir hata oluştu' };
  }
}
