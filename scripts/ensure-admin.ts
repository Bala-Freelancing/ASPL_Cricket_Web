import { prisma } from '../src/lib/prisma';
import { hashPassword } from '../src/lib/auth';

async function ensureAdmin() {
  const passwordHash = await hashPassword('admin123');

  const adminData = [
    { email: 'admin@ipl.com', phone: '+919999999999' },
    { email: 'admin@aspl.com', phone: '+919999999998' },
  ];

  for (const item of adminData) {
    const admin = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        name: 'Tournament Admin',
        role: 'ADMIN',
        passwordHash,
        isActive: true,
      },
      create: {
        name: 'Tournament Admin',
        email: item.email,
        phone: item.phone,
        passwordHash,
        role: 'ADMIN',
        isActive: true,
      },
    });
    console.log(`✅ Admin Account Verified: ${admin.email} | Role: ${admin.role}`);
  }
}

ensureAdmin().finally(() => prisma.$disconnect());

