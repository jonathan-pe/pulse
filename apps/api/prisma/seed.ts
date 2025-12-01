import { prisma } from '../src/index.js'

async function main() {
  console.log('🌱 Seeding database...')

  // Example: Create some sample data
  // Uncomment and modify based on your schema

  /*
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      name: 'Test User',
      clerkId: 'user_test123',
    },
  });

  console.log('✓ Created test user:', user.email);
  */

  console.log('✅ Seeding complete!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
