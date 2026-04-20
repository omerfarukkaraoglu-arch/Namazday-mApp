import { hasAdminPrivileges, isVIPAdmin } from '@/lib/auth';
import { getUserContext } from '@/lib/auth-server';
import { redirect } from 'next/navigation';
import { PrayerTimeSettingsClient } from './PrayerTimeSettingsClient';
import { getSettingsData } from '@/actions/settings';

export const metadata = { title: 'Vakit Yönetimi | NamazdayımApp' };

export default async function PrayerTimesPage() {
  const user = await getUserContext();
  if (!user || (!hasAdminPrivileges(user.role) && !isVIPAdmin(user))) {
    redirect('/dashboard');
  }

  const data = await getSettingsData();

  return (
    <PrayerTimeSettingsClient 
      data={data.prayerTimes}
      classes={data.classes}
    />
  );
}
