import dotenv from 'dotenv';
dotenv.config();

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * ASPL 2026 — Safe Read-Only Prisma PostgreSQL Authentication Tester
 *
 * CRITICAL DIRECTIVE:
 * - Does NOT modify database tables, schema, dev.db, or dev.db.bak.
 * - Does NOT print any passwords or credentials.
 * - Runs a read-only query (SELECT 1) via Prisma Client using PostgreSQL schema.
 */
async function testPrismaPgAuth() {
  console.log('=============== PRISMA POSTGRESQL AUTH DIAGNOSIS ===============');

  const devDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  const devDbBakPath = path.join(process.cwd(), 'prisma', 'dev.db.bak');

  console.log('🛡️ Safety Check:');
  console.log(`   dev.db: ${fs.existsSync(devDbPath) ? 'UNTOUCHED ✅' : 'MISSING ❌'}`);
  console.log(`   dev.db.bak: ${fs.existsSync(devDbBakPath) ? 'UNTOUCHED ✅' : 'MISSING ❌'}`);

  const rawDbUrl = process.env.DATABASE_URL || '';
  const rawDirectUrl = process.env.DIRECT_URL || '';

  // Analysis of URL parameters (without printing secrets)
  const parseUrlInfo = (urlStr: string, name: string) => {
    try {
      // Fix unencoded @ in password for parsing test
      let fixedUrl = urlStr;
      const match = urlStr.match(/postgresql:\/\/([^:]+):([^@]+)@/);
      if (!match) {
        // Handle unencoded @ in password like postgresql://user:pass@word@host
        const lastAt = urlStr.lastIndexOf('@');
        const firstColonAfterScheme = urlStr.indexOf(':', 13);
        const user = urlStr.substring(13, firstColonAfterScheme);
        const pass = urlStr.substring(firstColonAfterScheme + 1, lastAt);
        const rest = urlStr.substring(lastAt + 1);
        fixedUrl = `postgresql://${user}:${encodeURIComponent(pass)}@${rest}`;
      }

      const u = new URL(fixedUrl);
      return {
        name,
        host: u.hostname,
        port: u.port,
        username: u.username,
        database: u.pathname.replace('/', ''),
        hasRawAtSymbolInPass: urlStr.includes('@') && !urlStr.includes('%40'),
        isEncoded: urlStr.includes('%40'),
      };
    } catch (err: any) {
      return { name, host: 'invalid', port: '0', username: 'invalid', database: 'invalid', hasRawAtSymbolInPass: false, isEncoded: false };
    }
  };

  const dbInfo = parseUrlInfo(rawDbUrl, 'DATABASE_URL');
  const dirInfo = parseUrlInfo(rawDirectUrl, 'DIRECT_URL');

  console.log('\n--- Parsed Configuration Summary ---');
  console.table([
    { Variable: dbInfo.name, Host: dbInfo.host, Port: dbInfo.port, Username: dbInfo.username, Database: dbInfo.database, 'Needs URL Encoding (%40)': dbInfo.hasRawAtSymbolInPass ? 'YES ⚠️' : 'NO ✅', 'Is Encoded': dbInfo.isEncoded ? 'YES ✅' : 'NO' },
    { Variable: dirInfo.name, Host: dirInfo.host, Port: dirInfo.port, Username: dirInfo.username, Database: dirInfo.database, 'Needs URL Encoding (%40)': dirInfo.hasRawAtSymbolInPass ? 'YES ⚠️' : 'NO ✅', 'Is Encoded': dirInfo.isEncoded ? 'YES ✅' : 'NO' },
  ]);

  console.log('\n--- Prisma Client Execution Test (SELECT 1) ---');

  // Test Direct URL authentication using tsx runtime
  const testScriptContent = `
import { PrismaClient } from '@prisma/client';
async function run() {
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  const p = new PrismaClient({ datasources: { db: { url } } });
  try {
    const res = await p.$queryRaw\`SELECT 1 as connected\`;
    console.log('QUERY_SUCCESS', JSON.stringify(res));
  } catch (err) {
    console.error('QUERY_FAILED', err.message);
  } finally {
    await p.$disconnect();
  }
}
run();
`;

  const tempScriptPath = path.join(process.cwd(), 'scripts', 'temp-auth-runner.ts');
  fs.writeFileSync(tempScriptPath, testScriptContent);

  try {
    const output = execSync('npx tsx scripts/temp-auth-runner.ts', { encoding: 'utf-8' });
    console.log('Result:', output);
  } catch (err: any) {
    console.log('Result Error:', err.stdout || err.message);
  } finally {
    if (fs.existsSync(tempScriptPath)) fs.unlinkSync(tempScriptPath);
  }
}

testPrismaPgAuth().catch(console.error);
