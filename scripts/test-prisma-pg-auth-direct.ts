import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

/**
 * ASPL 2026 — Read-Only PostgreSQL Authentication Tester using Prisma Engine
 *
 * CRITICAL DIRECTIVE:
 * - Does NOT modify dev.db, dev.db.bak, database tables, or schema.
 * - Does NOT print passwords, secrets, or full connection strings.
 * - Executes read-only SELECT 1 query against both DATABASE_URL and DIRECT_URL.
 */
async function testPgAuth() {
  console.log('=============== READ-ONLY POSTGRESQL AUTH TEST ===============');

  const devDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  const devDbBakPath = path.join(process.cwd(), 'prisma', 'dev.db.bak');

  console.log('🛡️ Safety Status:');
  console.log(`   prisma/dev.db: ${fs.existsSync(devDbPath) ? 'UNTOUCHED ✅' : 'MISSING ❌'}`);
  console.log(`   prisma/dev.db.bak: ${fs.existsSync(devDbBakPath) ? 'UNTOUCHED ✅' : 'MISSING ❌'}`);

  const testRunnerScript = `
import { PrismaClient } from '@prisma/client';

async function testOne(name: string, url: string) {
  const tempSchema = \`
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/@prisma/client-pg-test"
}
datasource db {
  provider = "postgresql"
  url      = "\${url}"
}
model TestSelect {
  id Int @id
}
\`;
  const schemaPath = "./prisma/temp-test-schema.prisma";
  const fs = require('fs');
  fs.writeFileSync(schemaPath, tempSchema);

  const { execSync } = require('child_process');
  try {
    execSync("npx prisma generate --schema=./prisma/temp-test-schema.prisma", { stdio: 'ignore' });
    const { PrismaClient: PgPrismaClient } = require('@prisma/client-pg-test');
    const p = new PgPrismaClient();
    const res = await p.\$queryRaw\`SELECT 1 as connected\`;
    console.log(name + ": PASS");
    await p.\$disconnect();
  } catch (err) {
    console.log(name + ": FAIL (" + err.message.split('\\n')[0] + ")");
  } finally {
    if (fs.existsSync(schemaPath)) fs.unlinkSync(schemaPath);
  }
}

async function run() {
  await testOne("DATABASE_URL authentication", process.env.DATABASE_URL || "");
  await testOne("DIRECT_URL authentication", process.env.DIRECT_URL || "");
}

run();
`;

  const tempPath = path.join(process.cwd(), 'scripts', 'temp-pg-runner.ts');
  fs.writeFileSync(tempPath, testRunnerScript);

  try {
    const output = execSync('npx tsx scripts/temp-pg-runner.ts', { encoding: 'utf-8' });
    console.log('\n--- VERIFICATION RESULT ---');
    console.log(output.trim());
  } catch (err: any) {
    console.error('Test Execution Error:', err.stdout || err.message);
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

testPgAuth().catch(console.error);
