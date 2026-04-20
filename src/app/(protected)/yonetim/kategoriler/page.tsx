import { hasAdminPrivileges, isVIPAdmin } from '@/lib/auth';
import { getUserContext } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { GenericSettingsClient } from '../GenericSettingsClient';
import { getSettingsData } from '@/actions/settings';

export const metadata = { title: 'Kategori Yönetimi | NamazdayımApp' };

export default async function CategoriesPage() {
  const user = await getUserContext();
  if (!user || (!hasAdminPrivileges(user.role) && !isVIPAdmin(user))) {
    redirect('/dashboard');
  }

  const data = await getSettingsData();

  return (
    <GenericSettingsClient 
      title="Kategoriler / Statüler"
      description="Sınıfları ve Seviyeleri gruplandırmak için kategoriler oluşturun (Örn: Ortaokul, Lise)."
      type="category"
      data={data.categories || []}
    />
  );
}
