import React from 'react';
import { getReportStats, getFilterOptions } from '@/actions/reports';
import { ReportsClient } from './ReportsClient';
import { getUserContext } from '@/lib/auth-server';
import { prisma } from '@/lib/db';

export const metadata = { title: 'Raporlar | NamazdayımApp' };

export default async function ReportsPage() {
  const user = await getUserContext();
  
  const [initialStats, options, institution] = await Promise.all([
    getReportStats(),
    getFilterOptions(),
    (user && user.institutionId) ? prisma.institution.findUnique({
      where: { id: user.institutionId },
      select: { name: true, logo: true }
    }) : null


  ]);

  const branding = {
    name: institution?.name || 'Namazdayım',
    logo: institution?.logo
  };

  return (
    <ReportsClient 
      initialStats={initialStats} 
      options={options} 
      branding={branding}
    />
  );
}
