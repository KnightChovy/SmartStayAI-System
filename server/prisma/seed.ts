import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import path from 'path';
import 'dotenv/config';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Cascade delete on foreign keys will clear associated tables
  await prisma.userSession.deleteMany({});
  await prisma.verificationToken.deleteMany({});
  await prisma.userProfile.deleteMany({});
  await prisma.user.deleteMany({});

  const adminPassword = await bcrypt.hash('adminPassword123', 8);
  const customerPassword = await bcrypt.hash('customerPassword123', 8);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartstay.ai' },
    update: {},
    create: {
      fullName: 'SmartStay Admin',
      email: 'admin@smartstay.ai',
      passwordHash: adminPassword,
      role: 'admin',
      status: 'active',
      emailVerifiedAt: new Date(),
      profile: {
        create: {
          nationality: 'Vietnamese',
          marketingOptIn: true,
        },
      },
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@smartstay.ai' },
    update: {},
    create: {
      fullName: 'Regular Customer',
      email: 'customer@smartstay.ai',
      passwordHash: customerPassword,
      role: 'customer',
      status: 'active',
      emailVerifiedAt: null,
      profile: {
        create: {
          nationality: 'Vietnamese',
          marketingOptIn: false,
        },
      },
    },
  });

  console.log('Seed completed successfully!');
  console.log('Sample Admin account:');
  console.log('  Email: admin@smartstay.ai');
  console.log('  Password: adminPassword123');
  console.log('Sample Customer account:');
  console.log('  Email: customer@smartstay.ai');
  console.log('  Password: customerPassword123');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
