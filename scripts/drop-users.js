import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);
  await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS public.handle_new_user();`);
  await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS public.users CASCADE;`);
  console.log("Dropped users table and triggers.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
