import React from 'react';
import { getOwnInstitution } from '@/actions/institutions';
import { getUserContext } from '@/lib/auth-server';
import { hasAdminPrivileges } from '@/lib/auth';
import { redirect } from 'next/navigation';
import InstitutionSettingsContent from './InstitutionSettingsContent';

export const metadata = { title: 'Kurum Bilgileri | Namazdayım' };

export default async function InstitutionSettingsPage() {
  const user = await getUserContext();
  if (!user || !hasAdminPrivileges(user)) {
    redirect('/dashboard');
  }

  const institution = await getOwnInstitution();
  if (!institution) {
    redirect('/dashboard');
  }

  return (
    <InstitutionSettingsContent institution={institution as any} />
  );
}
