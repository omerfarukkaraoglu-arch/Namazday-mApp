import { hasAdminPrivileges, isVIPAdmin, checkRole } from '@/lib/auth';
import { getUserContext } from '@/lib/auth-server';
import { UsersClient } from './UsersClient';
import { redirect } from 'next/navigation';
import { getUsers } from '@/actions/users';
import { prisma } from '@/lib/db';

export const metadata = { title: 'Kullanıcılar | NamazdayımApp' };

export default async function UsersPage() {
  const currentUser = await getUserContext();
  
  if (!currentUser || (!hasAdminPrivileges(currentUser.role) && !isVIPAdmin(currentUser))) {
    redirect('/dashboard');
  }

  const isSystemAdmin = checkRole(currentUser.role, 'SYSTEM_ADMIN') || currentUser.username === 'admin';

  const [users, institutions] = await Promise.all([
    getUsers(),
    isSystemAdmin ? prisma.institution.findMany({ select: { id: true, name: true } }) : Promise.resolve([])
  ]);

  return (
    <UsersClient 
      users={users} 
      currentUserId={currentUser.id} 
      institutions={institutions}
      isSystemAdmin={isSystemAdmin}
    />
  );
}
