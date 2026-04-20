import React from 'react';
import { redirect } from 'next/navigation';
import { getUserContext } from '@/lib/auth-server';
import { AppLayout } from '@/components/layout/AppLayout';
import { prisma } from '@/lib/db';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserContext();

  if (!user) {
    redirect('/login');
  }

  // Fetch fresh institution data to get the logo and live name
  const institution = user.institutionId 
    ? await prisma.institution.findUnique({
        where: { id: user.institutionId },
        select: { name: true, logo: true }
      })
    : null;


  return (
    <AppLayout 
      user={{ 
        username: user.username,
        displayName: user.displayName, 
        role: user.role, 
        institutionName: institution?.name || user.institutionName,
        institutionLogo: institution?.logo 
      }}
    >
      {children}
    </AppLayout>
  );
}
