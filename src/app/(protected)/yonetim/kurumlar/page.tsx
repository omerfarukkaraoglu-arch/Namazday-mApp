import React from 'react';
import InstitutionsClient from './InstitutionsClient';
import { getInstitutions } from '@/actions/institutions';
import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/auth-server';
import { isSystemAdmin } from '@/lib/auth';

export const metadata = {
  title: 'Kurum Yönetimi | Namazdayım',
};

export default async function InstitutionsPage() {
  const user = await getUserContext();
  
  if (!user || !isSystemAdmin(user)) {
    redirect('/dashboard');
  }

  const institutions = await getInstitutions();

  return <InstitutionsClient initialData={JSON.parse(JSON.stringify(institutions))} />;
}
