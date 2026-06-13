import { PrismaClient, UserRole } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import 'dotenv/config';
import { toUtcDate, eachNightOfStay } from '../src/utils/dates';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Sample accounts: one per role + a few extra applicants (role customer) so the hotel
// registration flow can be tested repeatedly (each applicant can submit one registration).
// Password convention: `<role>Password123` (e.g. applicants use `customerPassword123`).
const seedAccounts: { fullName: string; email: string; role: UserRole }[] = [
  { fullName: 'SmartStay Admin', email: 'admin@smartstay.ai', role: 'admin' },
  { fullName: 'Platform Manager', email: 'manager@smartstay.ai', role: 'platform_manager' },
  { fullName: 'Hotel Partner', email: 'partner@smartstay.ai', role: 'hotel_partner' },
  { fullName: 'Hotel Staff', email: 'staff@smartstay.ai', role: 'staff' },
  { fullName: 'Marketing Staff', email: 'marketer@smartstay.ai', role: 'marketer' },
  { fullName: 'Regular Customer', email: 'customer@smartstay.ai', role: 'customer' },
  { fullName: 'Guest User', email: 'guest@smartstay.ai', role: 'guest' },
  // Extra applicants for repeatable hotel-registration testing
  { fullName: 'Hotel Applicant 1', email: 'applicant1@smartstay.ai', role: 'customer' },
  { fullName: 'Hotel Applicant 2', email: 'applicant2@smartstay.ai', role: 'customer' },
];

async function main() {
  console.log('Seeding database...');

  // Reset all data (dev only): truncate every table except the migration history.
  // CASCADE handles foreign-key dependencies regardless of onDelete: Restrict.
  const tables = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  const tableNames = tables.map((t) => `"public"."${t.tablename}"`).join(', ');
  if (tableNames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tableNames} RESTART IDENTITY CASCADE`);
  }

  for (const account of seedAccounts) {
    const password = `${account.role}Password123`;
    const passwordHash = await bcrypt.hash(password, 8);

    await prisma.user.upsert({
      where: { email: account.email },
      update: {},
      create: {
        fullName: account.fullName,
        email: account.email,
        passwordHash,
        role: account.role,
        status: 'active',
        emailVerifiedAt: new Date(),
        profile: {
          create: {
            nationality: 'Vietnamese',
            marketingOptIn: false,
          },
        },
      },
    });

    console.log(`  ✓ ${account.role.padEnd(18)} ${account.email}  (password: ${password})`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
