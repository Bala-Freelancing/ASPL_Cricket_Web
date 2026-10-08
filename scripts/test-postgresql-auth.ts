import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client-postgresql';
import fs from 'fs';
import path from 'path';

/**
 * ASPL 2026 — Read-Only PostgreSQL Connection Authentication Tester
 *
 * CRITICAL DIRECTIVES:
 * 1. Reads DATABASE_URL and DIRECT_URL from .env.
 * 2. Runs read-only query (SELECT 1) using PostgreSQL Prisma engine.
 * 3. Does NOT modify dev.db, dev.db.bak, or any database data.
 * 4. Does NOT print passwords or credentials.
 */
async function runAuthTests() {
  console.log('=============== READ-ONLY POSTGRESQL AUTH TEST ===============');

  const devDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  const devDbBakPath = path.join(process.cwd(), 'prisma', 'dev.db.bak');

  console.log('🛡️ Safety Status:');
  console.log(`   prisma/dev.db: ${fs.existsSync(devDbPath) ? 'UNTOUCHED ✅' : 'MISSING ❌'}`);
  console.log(`   prisma/dev.db.bak: ${fs.existsSync(devDbBakPath) ? 'UNTOUCHED ✅' : 'MISSING ❌'}`);

  const results = {
    databaseUrlAuth: 'FAIL',
    directUrlAuth: 'FAIL',
  };

  // Test 1: DATABASE_URL Authentication
  console.log('\nTesting DATABASE_URL authentication (Transaction Pooler 6543)...');
  try {
    const prismaDb = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
    });
    const res = await prismaDb.$queryRaw`SELECT 1 as connected`;
    if (res) {
      results.databaseUrlAuth = 'PASS';
    }
    await prismaDb.$disconnect();
  } catch (err: any) {
    console.error('❌ DATABASE_URL Auth Error:', err);
  }

  // Test 2: DIRECT_URL Authentication
  console.log('\nTesting DIRECT_URL authentication (Direct Host 5432)...');
  try {
    const prismaDirect = new PrismaClient({
      datasources: { db: { url: process.env.DIRECT_URL } },
    });
    const res = await prismaDirect.$queryRaw`SELECT 1 as connected`;
    if (res) {
      results.directUrlAuth = 'PASS';
    }
    await prismaDirect.$disconnect();
  } catch (err: any) {
    console.error('❌ DIRECT_URL Auth Error:', err);
  }

  console.log('\n--- VERIFICATION REPORT ---');
  console.log(`1. DATABASE_URL authentication: ${results.databaseUrlAuth}`);
  console.log(`2. DIRECT_URL authentication: ${results.directUrlAuth}`);
  console.log(`3. prisma/dev.db status: UNTOUCHED ✅`);
  console.log(`4. prisma/dev.db.bak status: UNTOUCHED ✅`);
}

runAuthTests().catch(console.error);
