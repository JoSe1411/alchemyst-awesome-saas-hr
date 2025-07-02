import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const categories = [
  { name: 'HR Policies', description: 'Human Resources policies and procedures' },
  { name: 'Benefits', description: 'Employee benefits and compensation' },
  { name: 'Remote Work', description: 'Remote work policies and guidelines' },
  { name: 'Time Off', description: 'Vacation, sick leave, and time off policies' },
  { name: 'Code of Conduct', description: 'Behavioral guidelines and ethics' },
  { name: 'Compliance', description: 'Legal and regulatory compliance' },
  { name: 'Training', description: 'Training and development policies' },
  { name: 'Security', description: 'Information security and data protection' },
]

async function main() {
  console.log('🌱 Seeding policy categories...')
  
  for (const category of categories) {
    await prisma.policyCategory.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    })
    console.log(`✅ Added category: ${category.name}`)
  }
  
  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 