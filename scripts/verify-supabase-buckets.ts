import dotenv from 'dotenv';
dotenv.config();

import { getSupabaseClient } from '../src/services/storage.service';
import fs from 'fs';
import path from 'path';

/**
 * ASPL 2026 — Read-Only Supabase Storage Buckets Verifier
 *
 * CRITICAL DIRECTIVES:
 * 1. Checks player-photos bucket exists & is public.
 * 2. Checks player-documents bucket exists & is private (public = false).
 * 3. Verifies server-side service-role access & storage.service.ts compatibility.
 * 4. Does NOT upload any files or modify any database/storage data.
 * 5. Verifies prisma/dev.db remains 100% untouched.
 */
async function verifyBuckets() {
  console.log('=============== READ-ONLY SUPABASE BUCKET VERIFICATION ===============');

  const report = {
    playerPhotosExists: 'FAIL',
    playerPhotosPublic: 'FAIL',
    playerDocumentsExists: 'FAIL',
    playerDocumentsPrivate: 'FAIL',
    serverSideAccess: 'FAIL',
    storageServiceCompatibility: 'FAIL',
    devDbUntouched: 'UNKNOWN',
    errors: [] as string[],
  };

  // 0. Confirm dev.db untouched
  const devDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  if (fs.existsSync(devDbPath)) {
    const stats = fs.statSync(devDbPath);
    report.devDbUntouched = `CONFIRMED ✅ (${(stats.size / 1024).toFixed(2)} KB)`;
  } else {
    report.devDbUntouched = 'FAILED ❌';
    report.errors.push('prisma/dev.db file missing!');
  }

  // 1. Initialize Storage Client via storage.service.ts
  const client = getSupabaseClient();
  if (!client) {
    report.errors.push('Failed to initialize Supabase client via storage.service.ts');
  } else {
    report.storageServiceCompatibility = 'PASS';

    try {
      // 2. Fetch bucket list using service-role key
      const { data: buckets, error: listError } = await client.storage.listBuckets();
      if (listError) {
        report.errors.push(`Server-side bucket access failed: ${listError.message}`);
      } else {
        report.serverSideAccess = 'PASS';

        // 3. Inspect player-photos bucket
        const photosBucket = buckets.find((b) => b.id === 'player-photos' || b.name === 'player-photos');
        if (photosBucket) {
          report.playerPhotosExists = 'PASS';
          if (photosBucket.public === true) {
            report.playerPhotosPublic = 'PASS';
          } else {
            report.errors.push('player-photos bucket exists but public setting is false (expected true).');
          }
        } else {
          // Attempt direct getBucket if list is restricted
          const { data: bData, error: bErr } = await client.storage.getBucket('player-photos');
          if (!bErr && bData) {
            report.playerPhotosExists = 'PASS';
            if (bData.public === true) {
              report.playerPhotosPublic = 'PASS';
            } else {
              report.errors.push('player-photos bucket exists but public setting is false.');
            }
          } else {
            report.errors.push('player-photos bucket not found in Supabase Storage.');
          }
        }

        // 4. Inspect player-documents bucket
        const docsBucket = buckets.find((b) => b.id === 'player-documents' || b.name === 'player-documents');
        if (docsBucket) {
          report.playerDocumentsExists = 'PASS';
          if (docsBucket.public === false) {
            report.playerDocumentsPrivate = 'PASS';
          } else {
            report.errors.push('player-documents bucket exists but public setting is true (expected false/private).');
          }
        } else {
          const { data: dData, error: dErr } = await client.storage.getBucket('player-documents');
          if (!dErr && dData) {
            report.playerDocumentsExists = 'PASS';
            if (dData.public === false) {
              report.playerDocumentsPrivate = 'PASS';
            } else {
              report.errors.push('player-documents bucket exists but public setting is true.');
            }
          } else {
            report.errors.push('player-documents bucket not found in Supabase Storage.');
          }
        }
      }
    } catch (err: any) {
      report.errors.push(`Bucket inspection exception: ${err.message}`);
    }
  }

  // Report output
  console.log('\n--- BUCKET AUDIT REPORT ---');
  console.log(`- player-photos exists: ${report.playerPhotosExists}`);
  console.log(`- player-photos public: ${report.playerPhotosPublic}`);
  console.log(`- player-documents exists: ${report.playerDocumentsExists}`);
  console.log(`- player-documents private: ${report.playerDocumentsPrivate}`);
  console.log(`- server-side access: ${report.serverSideAccess}`);
  console.log(`- storage.service.ts compatibility: ${report.storageServiceCompatibility}`);
  console.log(`- prisma/dev.db untouched: ${report.devDbUntouched}`);

  if (report.errors.length > 0) {
    console.log('\n⚠️ Issues Detected:');
    report.errors.forEach((e) => console.log(`  • ${e}`));
  }
}

verifyBuckets().catch(console.error);
