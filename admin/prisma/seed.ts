import { PrismaClient, Role, TableStatus, CouponType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database...');
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.coupon.deleteMany({});
  await prisma.waitlist.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Seeding Users...');
  await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@cafe.com',
      password: 'adminpassword',
      role: Role.ADMIN,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Employee User',
      email: 'employee@cafe.com',
      password: 'employeepassword',
      role: Role.EMPLOYEE,
    },
  });

  console.log('Seeding Categories...');
  const burgers = await prisma.category.create({
    data: { name: 'Burgers', color: '#FF6B6B' },
  });

  const drinks = await prisma.category.create({
    data: { name: 'Drinks', color: '#4DABF7' },
  });

  const desserts = await prisma.category.create({
    data: { name: 'Desserts', color: '#FCC419' },
  });

  console.log('Seeding Products...');
  await prisma.product.createMany({
    data: [
      {
        name: 'Veg Burger',
        price: 120.0,
        tax: 5.0,
        description: 'Delicious vegetable patty burger with fresh lettuce and cheese.',
        categoryId: burgers.id,
      },
      {
        name: 'Chicken Burger',
        price: 180.0,
        tax: 5.0,
        description: 'Juicy grilled chicken patty with signature sauce.',
        categoryId: burgers.id,
      },
      {
        name: 'Coffee',
        price: 80.0,
        tax: 18.0,
        description: 'Rich brewed espresso with milk.',
        categoryId: drinks.id,
      },
      {
        name: 'Tea',
        price: 40.0,
        tax: 18.0,
        description: 'Traditional spiced masala tea.',
        categoryId: drinks.id,
      },
      {
        name: 'Brownie',
        price: 110.0,
        tax: 12.0,
        description: 'Warm fudge brownie topped with chocolate syrup.',
        categoryId: desserts.id,
      },
    ],
  });

  console.log('Seeding Tables...');
  await prisma.table.createMany({
    data: [
      { tableNumber: 'Table 1', seats: 2, status: TableStatus.FREE, floor: 'Ground Floor' },
      { tableNumber: 'Table 2', seats: 4, status: TableStatus.FREE, floor: 'Ground Floor' },
      { tableNumber: 'Table 3', seats: 2, status: TableStatus.FREE, floor: 'Ground Floor' },
      { tableNumber: 'Table 4', seats: 6, status: TableStatus.FREE, floor: 'First Floor' },
      { tableNumber: 'Table 5', seats: 4, status: TableStatus.FREE, floor: 'First Floor' },
      { tableNumber: 'Table 6', seats: 8, status: TableStatus.FREE, floor: 'First Floor' },
    ],
  });

  console.log('Seeding Coupons...');
  await prisma.coupon.createMany({
    data: [
      { code: 'WELCOME10', type: CouponType.PERCENTAGE, value: 10.0 },
      { code: 'FLAT50', type: CouponType.FIXED, value: 50.0 },
    ],
  });

  console.log('Seeding Waitlist...');
  await prisma.waitlist.createMany({
    data: [
      { customerName: 'John Doe', groupSize: 4, status: 'WAITING' },
      { customerName: 'Alice Smith', groupSize: 2, status: 'WAITING' },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
