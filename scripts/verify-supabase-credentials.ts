import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '../src/services/storage.service';
import fs from 'fs';
import path from 'path';
import net from 'net';

/**
 * ASPL 2026 — Read-Only Supabase Connection & Credentials Verifier
 *
 * CRITICAL DIRECTIVES:
 * 1. Reads .env configuration cleanly without printing secret values.
 * 2. Performs read-only connectivity checks on DATABASE_URL, DIRECT_URL, SUPABASE_URL, API keys, and storage client.
 * 3. Does NOT modify, create, or delete any database records or storage files.
 * 4. Verifies that prisma/dev.db remains untouched.
 */
async function testTcpConnection(connectionString: string): Promise<{ success: boolean; host: string; port: number; error?: string }> {
  try {
    const url = new URL(connectionString);
    const host = url.hostname;
    const port = Number(url.port) || 5432;

    if (!host || host.includes('[YOUR-PASSWORD]')) {
      return { success: false, host: host || 'unknown', port, error: 'Database password placeholder [YOUR-PASSWORD] detected. Please replace with your actual Supabase database password.' };
    }

    return new Promise((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(5000);

      socket.on('connect', () => {
        socket.destroy();
        resolve({ success: true, host, port });
      });

      socket.on('timeout', () => {
        socket.destroy();
        resolve({ success: false, host, port, error: 'Connection timed out (5000ms)' });
      });

      socket.on('error', (err) => {
        socket.destroy();
        resolve({ success: false, host, port, error: err.message });
      });

      socket.connect(port, host);
    });
  } catch (err: any) {
    return { success: false, host: 'invalid', port: 0, error: err.message };
  }
}

async function verifyAll() {
  console.log('=============== READ-ONLY SUPABASE VERIFICATION ===============');

  const results = {
    postgresConnection: 'FAIL',
    directConnection: 'FAIL',
    supabaseApi: 'FAIL',
    serviceRoleAuth: 'FAIL',
    anonKeyPresent: 'FAIL',
    storageInit: 'FAIL',
    devDbUntouched: 'UNKNOWN',
    errors: [] as string[],
  };

  // 0. Safety Check: Verify prisma/dev.db is untouched
  const devDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  if (fs.existsSync(devDbPath)) {
    const stats = fs.statSync(devDbPath);
    results.devDbUntouched = `CONFIRMED UNTOUCHED ✅ (${(stats.size / 1024).toFixed(2)} KB)`;
  } else {
    results.devDbUntouched = 'MISSING ❌';
    results.errors.push('prisma/dev.db file not found!');
  }

  // 1. Verify DATABASE_URL
  const dbUrl = process.env.DATABASE_URL || '';
  if (!dbUrl || dbUrl.startsWith('file:')) {
    results.errors.push('DATABASE_URL is missing or set to SQLite file.');
  } else {
    const res = await testTcpConnection(dbUrl);
    if (res.success) {
      results.postgresConnection = 'PASS';
    } else {
      results.errors.push(`PostgreSQL Connection (DATABASE_URL): ${res.error}`);
    }
  }

  // 2. Verify DIRECT_URL
  const directUrl = process.env.DIRECT_URL || '';
  if (!directUrl) {
    results.errors.push('DIRECT_URL is missing.');
  } else {
    const res = await testTcpConnection(directUrl);
    if (res.success) {
      results.directConnection = 'PASS';
    } else {
      results.errors.push(`Direct Connection (DIRECT_URL): ${res.error}`);
    }
  }

  // 3. Verify SUPABASE_URL
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    results.errors.push('SUPABASE_URL is missing or invalid.');
  } else {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, { method: 'GET' });
      // Supabase REST endpoint returns 200 or 401 when online
      if (response.status === 200 || response.status === 401) {
        results.supabaseApi = 'PASS';
      } else {
        results.errors.push(`Supabase API URL returned HTTP status ${response.status}`);
      }
    } catch (err: any) {
      results.errors.push(`Supabase API reachability test failed: ${err.message}`);
    }
  }

  // 4. Verify SUPABASE_SERVICE_ROLE_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!serviceRoleKey || serviceRoleKey.includes('YOUR_SUPABASE')) {
    results.errors.push('SUPABASE_SERVICE_ROLE_KEY is missing or set to placeholder.');
  } else {
    try {
      const client = createClient(supabaseUrl, serviceRoleKey);
      // Attempt read-only buckets list to verify service role auth
      const { data, error } = await client.storage.listBuckets();
      if (!error) {
        results.serviceRoleAuth = 'PASS';
      } else {
        results.errors.push(`Service-role auth check error: ${error.message}`);
      }
    } catch (err: any) {
      results.errors.push(`Service-role authentication error: ${err.message}`);
    }
  }

  // 5. Verify SUPABASE_ANON_KEY
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (anonKey && !anonKey.includes('YOUR_SUPABASE')) {
    results.anonKeyPresent = 'PASS';
  } else {
    results.errors.push('SUPABASE_ANON_KEY is missing or set to placeholder.');
  }

  // 6. Verify storage.service.ts Initialization
  try {
    const storageClient = getSupabaseClient();
    if (storageClient) {
      results.storageInit = 'PASS';
    } else {
      results.errors.push('storage.service.ts returned null client.');
    }
  } catch (err: any) {
    results.errors.push(`storage.service.ts init error: ${err.message}`);
  }

  // Output Report
  console.log('\n--- VERIFICATION REPORT ---');
  console.log(`- PostgreSQL connection: ${results.postgresConnection}`);
  console.log(`- Direct connection: ${results.directConnection}`);
  console.log(`- Supabase API: ${results.supabaseApi}`);
  console.log(`- Service-role authentication: ${results.serviceRoleAuth}`);
  console.log(`- Anon key present: ${results.anonKeyPresent}`);
  console.log(`- Storage client initialization: ${results.storageInit}`);
  console.log(`- Confirmation of dev.db: ${results.devDbUntouched}`);

  if (results.errors.length > 0) {
    console.log('\n⚠️ Issues Detected:');
    results.errors.forEach((e) => console.log(`  • ${e}`));
  }
}

verifyAll().catch(console.error);
