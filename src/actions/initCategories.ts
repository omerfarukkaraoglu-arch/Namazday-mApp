import { prisma } from '../lib/db';
import { getUserContext } from '../lib/auth-server';

export async function initDefaultCategories() {
  const user = await getUserContext();
  if (!user) return { error: 'Oturum kapalı.' };

  const categories = [
    { name: 'Ortaokul', sortOrder: 1 },
    { name: 'Lise', sortOrder: 2 }
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name_institutionId: { name: cat.name, institutionId: user.institutionId } },
      update: {},
      create: { 
        name: cat.name, 
        sortOrder: cat.sortOrder, 
        institutionId: user.institutionId 
      }
    });
  }

  return { success: true };
}
