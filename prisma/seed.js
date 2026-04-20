const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function main() {
  // 1. Create a Default Institution
  const defaultInst = await prisma.institution.upsert({
    where: { name: 'Merkez Kurum' },
    update: {},
    create: {
      name: 'Merkez Kurum',
    },
  })

  console.log('Default Institution created:', defaultInst.name)

  // 2. Create Super Admin (SYSTEM_ADMIN)
  const passwordHash = await bcrypt.hash('admin123', 10)
  
  const superAdmin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash,
      displayName: 'Süper Admin',
      role: 'SYSTEM_ADMIN',
      institutionId: defaultInst.id
    },
  })

  console.log('Master Admin created:', superAdmin.username)
  
  // 3. Create Default Prayer Times
  const defaultTimes = [
    { name: 'Sabah', sortOrder: 1, isDefault: true },
    { name: 'Öğle', sortOrder: 2, isDefault: true },
    { name: 'İkindi', sortOrder: 3, isDefault: true },
    { name: 'Akşam', sortOrder: 4, isDefault: true },
    { name: 'Yatsı', sortOrder: 5, isDefault: true },
  ]
  
  for (const time of defaultTimes) {
    await prisma.prayerTime.upsert({
      where: { 
        name_institutionId: {
          name: time.name,
          institutionId: defaultInst.id
        }
      },
      update: {},
      create: { 
        ...time,
        institutionId: defaultInst.id
      }
    });
  }

  console.log('Seed completed successfully!')
  console.log('Login: admin / admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
