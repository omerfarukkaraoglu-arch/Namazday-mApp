import { hasAdminPrivileges, isVIPAdmin } from '@/lib/auth';
import { getUserContext } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { GenericSettingsClient } from '../GenericSettingsClient';
import { getSettingsData } from '@/actions/settings';

export const metadata = { title: 'Seviye Yönetimi | NamazdayımApp' };

export default async function LevelsPage() {
  const user = await getUserContext();
  if (!user || (!hasAdminPrivileges(user.role) && !isVIPAdmin(user))) {
    redirect('/dashboard');
  }

  const data = await getSettingsData();

  return (
    <GenericSettingsClient 
      title="Seviyeler / Kademeler"
      description="Öğrencilerin gruplandığı seviyeleri tanımlayın (Örn: Lise, Hafızlık, LGS)."
      type="level"
      data={data.levels}
      categories={data.categories}
    />
  );
}
