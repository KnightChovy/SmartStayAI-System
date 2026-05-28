import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import config from './config';

const pool = new Pool({ connectionString: config.prisma.url });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
  log: config.env === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export default prisma;
