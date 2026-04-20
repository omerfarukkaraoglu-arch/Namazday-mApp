const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding dummy data...')
  
  // Create Classes
  const class9A = await prisma.class.upsert({
    where: { name: '9-A' },
    update: {},
    create: { name: '9-A', sortOrder: 1 },
  })

  const class10B = await prisma.class.upsert({
    where: { name: '10-B' },
    update: {},
    create: { name: '10-B', sortOrder: 2 },
  })

  // Create Levels
  const lvl1 = await prisma.level.upsert({
    where: { name: 'Hafızlık Öncesi Eğitim' },
    update: {},
    create: { name: 'Hafızlık Öncesi Eğitim', sortOrder: 1 },
  })
  
  // Create Students
  const students = [
    { fullName: 'Ahmet Yılmaz', studentNo: '1001', classId: class9A.id, levelId: lvl1.id },
    { fullName: 'Mehmet Demir', studentNo: '1002', classId: class9A.id, levelId: lvl1.id },
    { fullName: 'Ali Can', studentNo: '1003', classId: class10B.id, levelId: lvl1.id },
    { fullName: 'Veli Şahin', studentNo: '1004', classId: class10B.id, levelId: lvl1.id },
    { fullName: 'Hasan Kuş', studentNo: '1005', classId: class9A.id, levelId: lvl1.id },
  ]

  for (const s of students) {
    await prisma.student.upsert({
      where: { studentNo: s.studentNo },
      update: {},
      create: s,
    })
  }

  console.log('Dummy students created successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
