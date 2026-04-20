import { hasAdminPrivileges, isVIPAdmin } from '@/lib/auth';
import { getUserContext } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { GenericSettingsClient } from '../GenericSettingsClient';
import { getSettingsData } from '@/actions/settings';

export const metadata = { title: 'Sınıf Yönetimi | NamazdayımApp' };

export default async function ClassesPage() {
  const user = await getUserContext();
  if (!user || (!hasAdminPrivileges(user.role) && !isVIPAdmin(user))) {
    redirect('/dashboard');
  }

  const data = await getSettingsData();

  return (
    <GenericSettingsClient 
      title="Sınıflar"
      description="Okuldaki sınıfları ekleyin, düzenleyin ve sıralarını belirleyin."
      type="class"
      data={data.classes}
    />
  );
}
