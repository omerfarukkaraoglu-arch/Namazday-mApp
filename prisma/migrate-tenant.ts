import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Kurumsal Geçiş Başlıyor ---');

  // 1. Varsayılan Kurum Oluştur
  const defaultInstitution = await prisma.institution.upsert({
    where: { name: 'Genel Kurum' },
    update: {},
    create: {
      name: 'Genel Kurum',
    },
  });

  console.log(`Kurum oluşturuldu: ${defaultInstitution.name} (${defaultInstitution.id})`);

  // 2. Tüm Kullanıcıları Bağla
  const users = await prisma.user.updateMany({
    where: { institutionId: null as any },
    data: { institutionId: defaultInstitution.id },
  });
  console.log(`${users.count} kullanıcı güncellendi.`);

  // 3. Tüm Sınıfları Bağla
  const classes = await prisma.class.updateMany({
    where: { institutionId: null as any },
    data: { institutionId: defaultInstitution.id },
  });
  console.log(`${classes.count} sınıf güncellendi.`);

  // 4. Tüm Seviyeleri Bağla
  const levels = await prisma.level.updateMany({
    where: { institutionId: null as any },
    data: { institutionId: defaultInstitution.id },
  });
  console.log(`${levels.count} seviye güncellendi.`);

  // 5. Tüm Öğrencileri Bağla
  const students = await prisma.student.updateMany({
    where: { institutionId: null as any },
    data: { institutionId: defaultInstitution.id },
  });
  console.log(`${students.count} öğrenci güncellendi.`);

  // 6. Tüm Vakitleri Bağla
  const prayers = await prisma.prayerTime.updateMany({
    where: { institutionId: null as any },
    data: { institutionId: defaultInstitution.id },
  });
  console.log(`${prayers.count} vakit güncellendi.`);

  // 7. Tüm Yoklamaları Bağla
  const attendances = await prisma.attendance.updateMany({
    where: { institutionId: null as any },
    data: { institutionId: defaultInstitution.id },
  });
  console.log(`${attendances.count} yoklama kaydı güncellendi.`);

  console.log('--- Geçiş Tamamlandı ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
