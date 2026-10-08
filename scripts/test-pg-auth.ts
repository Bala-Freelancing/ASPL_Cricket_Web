import dotenv from 'dotenv';
dotenv.config();
const { Client } = require('pg');

async function testConnection(name: string, url: string) {
  console.log(`\nTesting ${name}...`);
  if (!url) {
    console.log(`❌ ${name} is empty`);
    return;
  }
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 as result');
    console.log(`✅ ${name} SUCCESS:`, res.rows[0]);
    await client.end();
  } catch (err: any) {
    console.error(`❌ ${name} FAILED:`, err.message);
  }
}

async function run() {
  await testConnection('DATABASE_URL (Pooler 6543)', process.env.DATABASE_URL || '');
  await testConnection('DIRECT_URL (5432)', process.env.DIRECT_URL || '');
  
  // Try raw password without URL encoding
  const rawPwDb = (process.env.DATABASE_URL || '').replace('Aspl%402026', 'Aspl@2026');
  const rawPwDir = (process.env.DIRECT_URL || '').replace('Aspl%402026', 'Aspl@2026');
  
  await testConnection('DATABASE_URL (Raw Password)', rawPwDb);
  await testConnection('DIRECT_URL (Raw Password)', rawPwDir);

  // Try direct pooler with session mode
  const poolerDirect = "postgresql://postgres.wgvooaszixawfpkauccu:Aspl%402026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres";
  const poolerDirectRaw = "postgresql://postgres.wgvooaszixawfpkauccu:Aspl@2026@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres";

  await testConnection('Pooler 5432 (Encoded)', poolerDirect);
  await testConnection('Pooler 5432 (Raw)', poolerDirectRaw);
}

run().catch(console.error);
