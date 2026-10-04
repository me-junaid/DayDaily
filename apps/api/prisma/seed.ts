import process from 'node:process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const ENGAPUZHA_STORES = [
  {
    id: 'engapuzha-store-1',
    name: 'Engapuzha Town Kirana & Provisions',
    town: 'Engapuzha',
    pincode: '673586',
    phone: '9847110001',
    address: 'Near Main Bus Stand, NH 766, Engapuzha',
    isOpen: true,
  },
  {
    id: 'engapuzha-store-2',
    name: 'Puduppadi Super Daily Store',
    town: 'Engapuzha',
    pincode: '673586',
    phone: '9847110002',
    address: 'Kaithapoyil Junction, Engapuzha',
    isOpen: false,
  },
  {
    id: 'engapuzha-store-3',
    name: 'Malabar Kirana & General Store',
    town: 'Engapuzha',
    pincode: '673586',
    phone: '9847110003',
    address: 'Town Masjid Road, Engapuzha',
    isOpen: false,
  },
  {
    id: 'engapuzha-store-4',
    name: 'Kakkad Daily Needs Kirana',
    town: 'Engapuzha',
    pincode: '673586',
    phone: '9847110004',
    address: 'Old Bazaar Road, Engapuzha',
    isOpen: true,
  },
  {
    id: 'engapuzha-store-5',
    name: 'Wayanad Highway Kirana Bazaar',
    town: 'Engapuzha',
    pincode: '673586',
    phone: '9847110005',
    address: 'Near HP Fuel Station, Engapuzha',
    isOpen: true,
  },
];

async function main() {
  console.log('Seeding DayDaily Engapuzha partner kirana stores...');

  for (const storeData of ENGAPUZHA_STORES) {
    const store = await prisma.store.upsert({
      where: { id: storeData.id },
      update: { ...storeData },
      create: { ...storeData },
    });
    console.log(`Seeded store: ${store.name} (${store.town} - ${store.pincode})`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
