import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import config from './config';

const pool = new Pool({ connectionString: config.prisma.url });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  // Only warnings/errors by default to keep the console clean.
  // Add 'query' here temporarily if you need to debug raw SQL.
  log: config.env === 'development' ? ['warn', 'error'] : ['error'],
});

export default prisma;
