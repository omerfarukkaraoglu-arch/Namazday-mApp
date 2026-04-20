import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({
    where: { username: 'admin' },
    data: { role: 'SYSTEM_ADMIN' }
  });
  console.log('Admin rolü SYSTEM_ADMIN yapıldı.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
