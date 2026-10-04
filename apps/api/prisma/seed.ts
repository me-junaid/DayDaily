import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding DayDaily database...');

  const store = await prisma.store.upsert({
    where: { id: 'store-demo-1' },
    update: {},
    create: {
      id: 'store-demo-1',
      name: 'Pooja Supermarket',
      phone: '9876543210',
      address: 'Main Bazaar, Town Center',
      town: 'Manjeri',
      pincode: '676121',
      isOpen: true,
    },
  });

  console.log('Sample store created:', store.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
