require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_POS_SETTINGS = [
  ['pos_resident_discount_percent', '10'],
  ['pos_worker_discount_percent', '5'],
  ['pos_early_bird_discount_percent', '4'],
  ['pos_early_bird_end_time', '09:45'],
  ['pos_late_surcharge_percent', '3'],
  ['pos_late_surcharge_start_time', '11:00'],
  ['pos_shop_name', 'VRIENDS'],
  ['pos_shop_address', 'Poperinge, Belgique'],
];

async function main() {
  const adminHash = await bcrypt.hash('admin1234', 10);
  await prisma.user.upsert({
    where: { email: 'admin@vriends.be' },
    update: {},
    create: {
      name: 'Admin Vriends',
      email: 'admin@vriends.be',
      password: adminHash,
      role: 'admin',
      localStatus: true,
      discountPercent: 10,
    },
  });

  const ismaelHash = await bcrypt.hash('Admin1234', 10);
  await prisma.user.upsert({
    where: { email: 'ismaelbentaleb@hotmail.com' },
    update: {},
    create: {
      name: 'Ismael Bentaleb',
      email: 'ismaelbentaleb@hotmail.com',
      password: ismaelHash,
      role: 'admin',
      localStatus: true,
      discountPercent: 10,
    },
  });

  const cashierHash = await bcrypt.hash('caisse1234', 10);
  await prisma.user.upsert({
    where: { email: 'caisse@vriends.be' },
    update: {},
    create: {
      name: 'Caisse Vriends',
      email: 'caisse@vriends.be',
      password: cashierHash,
      role: 'cashier',
      localStatus: false,
      discountPercent: 0,
    },
  });

  const defaultCategories = ['Wraps', 'Boissons', 'Desserts', 'Jus', 'Autres'];
  for (let i = 0; i < defaultCategories.length; i++) {
    await prisma.category.upsert({
      where: { name: defaultCategories[i] },
      update: { sortOrder: i },
      create: { name: defaultCategories[i], sortOrder: i },
    });
  }

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    await prisma.product.createMany({
      data: [
        { name: 'Menu Phare', price: 7.0, category: 'Wraps', isFavorite: true },
        { name: 'Wrap Poulet', price: 6.5, category: 'Wraps', isFavorite: true },
        { name: 'Croissant', price: 2.5, category: 'Desserts', isFavorite: true },
        { name: 'Jus Zumex', price: 3.5, category: 'Jus', isFavorite: true },
        { name: 'Gaufre-Crêpe', price: 3.0, category: 'Desserts', isFavorite: false },
        { name: 'Café filtre', price: 2.2, category: 'Boissons', isFavorite: true },
        { name: 'Cappuccino', price: 3.2, category: 'Boissons', isFavorite: false },
        { name: 'Eau plate', price: 1.5, category: 'Boissons', isFavorite: false },
      ],
    });
    console.log('✅ Produits seed créés');
  }

  for (const [key, value] of DEFAULT_POS_SETTINGS) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  const qrUrl = await prisma.setting.findUnique({ where: { key: 'qr_code_url' } });
  if (!qrUrl) {
    const defaultUrl = 'https://www.vriendscoffeeshop.com/register';
    await prisma.setting.create({
      data: { key: 'qr_code_url', value: defaultUrl },
    });
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(defaultUrl)}&bgcolor=F7F5F2&color=3A2E25&margin=12`;
    await prisma.setting.create({
      data: { key: 'qr_code_image_url', value: qrImageUrl },
    });
  }

  console.log('✅ Seed PostgreSQL terminé');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
