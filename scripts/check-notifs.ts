import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const notifs = await prisma.whatsappNotification.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('--- RECENT WHATSAPP NOTIFICATIONS IN DB ---');
  console.log(JSON.stringify(notifs, null, 2));
}

main().finally(() => prisma.$disconnect());
