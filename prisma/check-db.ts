import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Teşhis Başlıyor ---');
  
  const users = await prisma.user.findMany({
    include: { institution: true }
  });
  
  console.log('Kullanıcılar:');
  users.forEach(u => {
    console.log(`- ${u.username} (Rol: ${u.role}, Kurum: ${u.institution?.name || 'YOK!'}, InstitutionId: ${u.institutionId})`);
  });

  const institutions = await prisma.institution.findMany();
  console.log('\nKurumlar:');
  institutions.forEach(i => {
    console.log(`- ${i.name} (${i.id})`);
  });

  console.log('--- Teşhis Tamamlandı ---');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
