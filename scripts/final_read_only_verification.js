const { PrismaClient } = require('@prisma/client');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

async function runVerification() {
  console.log('--- Final Read-Only Verification ---');
  let databaseUrlPass = false;
  let directUrlPass = false;
  let storagePass = false;
  let appStartupPass = false;

  // 1. DATABASE_URL test via Prisma
  try {
    const prismaDb = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } }
    });
    const dbRes = await prismaDb.$queryRaw`SELECT 1 as connected;`;
    if (dbRes && dbRes[0] && dbRes[0].connected === 1) {
      databaseUrlPass = true;
    }
    await prismaDb.$disconnect();
  } catch (err) {
    console.error('DATABASE_URL test error:', err.message);
  }

  // 2. DIRECT_URL test via Prisma
  try {
    const prismaDirect = new PrismaClient({
      datasources: { db: { url: process.env.DIRECT_URL } }
    });
    const directRes = await prismaDirect.$queryRaw`SELECT 1 as connected;`;
    if (directRes && directRes[0] && directRes[0].connected === 1) {
      directUrlPass = true;
    }
    await prismaDirect.$disconnect();
  } catch (err) {
    console.error('DIRECT_URL test error:', err.message);
  }

  // 3. Supabase Storage test
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const { data, error } = await supabase.storage.listBuckets();
      if (!error && Array.isArray(data)) {
        storagePass = true;
      }
    }
  } catch (err) {
    console.error('Storage test error:', err.message);
  }

  // 4. Application startup test against PostgreSQL
  try {
    const prismaApp = new PrismaClient();
    const userCount = await prismaApp.user.count();
    const teamCount = await prismaApp.team.count();
    if (typeof userCount === 'number' && typeof teamCount === 'number') {
      appStartupPass = true;
    }
    await prismaApp.$disconnect();
  } catch (err) {
    console.error('App startup test error:', err.message);
  }

  console.log('\n--- VERIFICATION RESULTS ---');
  console.log(`DATABASE_URL: ${databaseUrlPass ? 'PASS' : 'FAIL'}`);
  console.log(`DIRECT_URL: ${directUrlPass ? 'PASS' : 'FAIL'}`);
  console.log(`Storage: ${storagePass ? 'PASS' : 'FAIL'}`);
  console.log(`Application startup: ${appStartupPass ? 'PASS' : 'FAIL'}`);
}

runVerification().catch(console.error);
