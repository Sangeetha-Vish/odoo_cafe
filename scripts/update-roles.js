import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.user.update({ where: { email: 'cafe.admin@gmail.com' }, data: { role: 'ADMIN' }});
  await prisma.user.update({ where: { email: 'cafe.kitchen@gmail.com' }, data: { role: 'KITCHEN_EMPLOYEE' }});
  await prisma.user.update({ where: { email: 'cafe.employee@gmail.com' }, data: { role: 'EMPLOYEE' }});
  console.log("Roles updated.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
