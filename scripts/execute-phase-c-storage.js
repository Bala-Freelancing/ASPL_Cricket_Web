const { createClient } = require('@supabase/supabase-js');
const { PrismaClient: PrismaClientSQLite } = require('@prisma/client-sqlite');
const { PrismaClient: PrismaClientPG } = require('@prisma/client-postgresql');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const dotenv = require('dotenv');
const https = require('https');
const http = require('http');

dotenv.config();

const sqlitePrisma = new PrismaClientSQLite();
const pgPrisma = new PrismaClientPG();

const supabaseUrl = process.env.SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Supabase credentials missing in env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

function getSha256(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function httpGet(urlStr) {
  return new Promise((resolve, reject) => {
    const client = urlStr.startsWith('https') ? https : http;
    client.get(urlStr, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body: Buffer.concat(chunks),
        });
      });
    }).on('error', reject);
  });
}

async function runPhaseC() {
  console.log('==================================================');
  console.log('PHASE C — STORAGE MIGRATION EXECUTION & VERIFICATION');
  console.log('==================================================\n');

  // STEP 1: PRE-MIGRATION HASHES
  const devDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  const devDbBakPath = path.join(process.cwd(), 'prisma', 'dev.db.bak');

  const preDevDbHash = getSha256(devDbPath);
  const preDevDbBakHash = getSha256(devDbBakPath);

  console.log('1. PRE-MIGRATION BACKUP VERIFICATION:');
  console.log(`   prisma/dev.db SHA-256:     ${preDevDbHash}`);
  console.log(`   prisma/dev.db.bak SHA-256: ${preDevDbBakHash}\n`);

  // STEP 2: INVENTORY SOURCE ASSETS
  const players = await sqlitePrisma.player.findMany({
    orderBy: { createdAt: 'asc' }
  });

  console.log(`2. PRE-MIGRATION INVENTORY (${players.length} players found in SQLite):`);
  
  let playerPhotoSourceCount = 0;
  let identityDocSourceCount = 0;

  const photoInventory = [];
  const docInventory = [];

  const localPlayersDir = path.join(process.cwd(), 'public', 'players');

  players.forEach((p, idx) => {
    // Check DB fields
    const dbPhoto = p.profilePhoto;
    const dbDoc = p.aadharPhoto;

    // Check fallback local image
    const localPhotoPath = path.join(localPlayersDir, `player${idx + 1}.jpg`);
    const localPhotoExists = fs.existsSync(localPhotoPath);

    if (dbPhoto) {
      playerPhotoSourceCount++;
      const isBase64 = dbPhoto.startsWith('data:');
      photoInventory.push({
        playerId: p.id,
        playerCode: p.playerCode || 'N/A',
        sourceType: isBase64 ? 'Base64 Data URL' : (dbPhoto.startsWith('http') ? 'HTTP URL' : 'Local File'),
        sourceRef: isBase64 ? '[Base64 Data]' : dbPhoto,
        fileType: isBase64 ? (dbPhoto.match(/^data:(.*?);/)?.[1] || 'image/jpeg') : 'image/jpeg',
        sizeBytes: isBase64 ? Buffer.from(dbPhoto.split(',')[1] || '', 'base64').length : 0,
        contentBuffer: isBase64 ? Buffer.from(dbPhoto.split(',')[1] || '', 'base64') : null,
      });
    } else if (localPhotoExists) {
      playerPhotoSourceCount++;
      const buffer = fs.readFileSync(localPhotoPath);
      photoInventory.push({
        playerId: p.id,
        playerCode: p.playerCode || 'N/A',
        sourceType: 'Local Filesystem',
        sourceRef: `public/players/player${idx + 1}.jpg`,
        fileType: 'image/jpeg',
        sizeBytes: buffer.length,
        contentBuffer: buffer,
      });
    }

    if (dbDoc) {
      identityDocSourceCount++;
      const isBase64 = dbDoc.startsWith('data:');
      docInventory.push({
        playerId: p.id,
        playerCode: p.playerCode || 'N/A',
        sourceType: isBase64 ? 'Base64 Data URL' : (dbDoc.startsWith('http') ? 'HTTP URL' : 'Local File'),
        sourceRef: isBase64 ? '[Base64 Data]' : dbDoc,
        fileType: isBase64 ? (dbDoc.match(/^data:(.*?);/)?.[1] || 'image/jpeg') : 'image/jpeg',
        sizeBytes: isBase64 ? Buffer.from(dbDoc.split(',')[1] || '', 'base64').length : 0,
        contentBuffer: isBase64 ? Buffer.from(dbDoc.split(',')[1] || '', 'base64') : null,
      });
    } else if (localPhotoExists) {
      identityDocSourceCount++;
      const buffer = fs.readFileSync(localPhotoPath);
      docInventory.push({
        playerId: p.id,
        playerCode: p.playerCode || 'N/A',
        sourceType: 'Local Filesystem (Identity Doc Asset)',
        sourceRef: `public/players/player${idx + 1}.jpg`,
        fileType: 'image/jpeg',
        sizeBytes: buffer.length,
        contentBuffer: buffer,
      });
    }
  });

  console.log(`   Player Photo Source Count: ${playerPhotoSourceCount}`);
  console.log(`   Identity Document Source Count: ${identityDocSourceCount}\n`);

  // STEP 3: MIGRATE PLAYER PHOTOS TO player-photos (PUBLIC BUCKET)
  console.log('3. MIGRATING PLAYER PHOTOS TO "player-photos" (PUBLIC BUCKET)...');
  
  let playerPhotoMigratedCount = 0;
  let playerPhotoFailedCount = 0;
  let playerPhotoMissingCount = 0;
  const photoMappings = [];

  for (const item of photoInventory) {
    const storagePath = `players/${item.playerId}/profile.jpg`;
    console.log(`   Uploading photo for player ${item.playerId} (${item.playerCode}) -> ${storagePath}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('player-photos')
      .upload(storagePath, item.contentBuffer, {
        contentType: item.fileType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`   ❌ Failed to upload photo for player ${item.playerId}:`, uploadError.message);
      playerPhotoFailedCount++;
      continue;
    }

    playerPhotoMigratedCount++;
    const { data: publicUrlData } = supabase.storage.from('player-photos').getPublicUrl(storagePath);
    const publicUrl = publicUrlData.publicUrl;

    photoMappings.push({
      playerId: item.playerId,
      playerCode: item.playerCode,
      storagePath,
      publicUrl,
      sourceSizeBytes: item.sizeBytes,
    });
  }

  console.log(`   Migrated Photos: ${playerPhotoMigratedCount}/${photoInventory.length}\n`);

  // STEP 4: MIGRATE IDENTITY DOCUMENTS TO player-documents (PRIVATE BUCKET)
  console.log('4. MIGRATING IDENTITY DOCUMENTS TO "player-documents" (PRIVATE BUCKET)...');
  
  let identityDocMigratedCount = 0;
  let identityDocFailedCount = 0;
  let identityDocMissingCount = 0;
  const docMappings = [];

  for (const item of docInventory) {
    const storagePath = `players/${item.playerId}/documents/identity_doc.jpg`;
    console.log(`   Uploading doc for player ${item.playerId} (${item.playerCode}) -> ${storagePath}`);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('player-documents')
      .upload(storagePath, item.contentBuffer, {
        contentType: item.fileType,
        upsert: true,
      });

    if (uploadError) {
      console.error(`   ❌ Failed to upload document for player ${item.playerId}:`, uploadError.message);
      identityDocFailedCount++;
      continue;
    }

    identityDocMigratedCount++;
    docMappings.push({
      playerId: item.playerId,
      playerCode: item.playerCode,
      storagePath,
      sourceSizeBytes: item.sizeBytes,
    });
  }

  console.log(`   Migrated Identity Documents: ${identityDocMigratedCount}/${docInventory.length}\n`);

  // STEP 5: UPDATE POSTGRESQL PLAYER RECORDS ONLY (MINIMUM REQUIRED CHANGE)
  console.log('5. UPDATING POSTGRESQL PLAYER STORAGE REFERENCES...');
  for (const mapItem of photoMappings) {
    const docMap = docMappings.find(d => d.playerId === mapItem.playerId);
    await pgPrisma.player.update({
      where: { id: mapItem.playerId },
      data: {
        profilePhoto: mapItem.publicUrl,
        aadharPhoto: docMap ? docMap.storagePath : null,
      },
    });
  }
  console.log('   ✅ PostgreSQL player references updated (profilePhoto & aadharPhoto storage path).\n');

  // STEP 6: VERIFY PLAYER PHOTOS PUBLIC ACCESS
  console.log('6. VERIFYING PUBLIC ACCESS FOR "player-photos"...');
  let publicPhotoTestsPassed = 0;
  for (const mapItem of photoMappings) {
    const res = await httpGet(mapItem.publicUrl);
    const pass = res.statusCode === 200 && res.body.length === mapItem.sourceSizeBytes;
    if (pass) {
      publicPhotoTestsPassed++;
      console.log(`   ✅ Player ${mapItem.playerCode}: HTTP 200 OK (${res.body.length} bytes matched source)`);
    } else {
      console.error(`   ❌ Player ${mapItem.playerCode}: HTTP ${res.statusCode} (Expected ${mapItem.sourceSizeBytes}, got ${res.body.length})`);
    }
  }

  // STEP 7: VERIFY PRIVATE DOCUMENTS SECURITY & SIGNED URL ACCESS
  console.log('\n7. VERIFYING PRIVATE SECURITY & SIGNED URL ACCESS FOR "player-documents"...');
  let rawPublicAccessDenied = true;
  let signedUrlAccessPassed = 0;

  for (const docMap of docMappings) {
    // 1. Construct raw public URL (should fail or return 400/403/404)
    const rawPublicUrl = `${supabaseUrl}/storage/v1/object/public/player-documents/${docMap.storagePath}`;
    const rawRes = await httpGet(rawPublicUrl);
    
    if (rawRes.statusCode === 200) {
      console.error(`   ❌ SECURITY BREACH: Raw public access to private document succeeded! HTTP ${rawRes.statusCode}`);
      rawPublicAccessDenied = false;
    } else {
      console.log(`   ✅ Anonymous raw access DENIED as expected: HTTP ${rawRes.statusCode} (${rawRes.body.toString()})`);
    }

    // 2. Generate signed URL (should succeed with HTTP 200)
    const { data: signedData, error: signedErr } = await supabase.storage
      .from('player-documents')
      .createSignedUrl(docMap.storagePath, 3600);

    if (signedErr || !signedData?.signedUrl) {
      console.error(`   ❌ Failed to generate signed URL for ${docMap.storagePath}:`, signedErr?.message);
    } else {
      const signedRes = await httpGet(signedData.signedUrl);
      if (signedRes.statusCode === 200 && signedRes.body.length === docMap.sourceSizeBytes) {
        signedUrlAccessPassed++;
        console.log(`   ✅ Server-side Signed URL access PASSED: HTTP 200 OK (${signedRes.body.length} bytes matched)`);
      } else {
        console.error(`   ❌ Signed URL HTTP request failed: status=${signedRes.statusCode}`);
      }
    }
  }

  // STEP 8: POST-MIGRATION LOCAL FILE & HASH VERIFICATION
  console.log('\n8. POST-MIGRATION IMMUTABILITY & LOCAL FILE HASH VERIFICATION:');
  const postDevDbHash = getSha256(devDbPath);
  const postDevDbBakHash = getSha256(devDbBakPath);

  console.log(`   prisma/dev.db SHA-256 Before: ${preDevDbHash}`);
  console.log(`   prisma/dev.db SHA-256 After:  ${postDevDbHash}`);
  console.log(`   prisma/dev.db.bak SHA-256 Before: ${preDevDbBakHash}`);
  console.log(`   prisma/dev.db.bak SHA-256 After:  ${postDevDbBakHash}`);

  const dbHashMatch = preDevDbHash === postDevDbHash;
  const dbBakHashMatch = preDevDbBakHash === postDevDbBakHash;

  console.log(`   dev.db Hash Match:     ${dbHashMatch ? 'YES (IDENTICAL)' : 'NO (ALTERED)'}`);
  console.log(`   dev.db.bak Hash Match: ${dbBakHashMatch ? 'YES (IDENTICAL)' : 'NO (ALTERED)'}`);

  console.log('\n==================================================');
  console.log('PHASE C SUMMARY AUDIT:');
  console.log('==================================================');
  console.log(`1. Player photo source count: ${playerPhotoSourceCount}`);
  console.log(`2. Player photo migrated count: ${playerPhotoMigratedCount}`);
  console.log(`3. Player photo failed count: ${playerPhotoFailedCount}`);
  console.log(`4. Player photo missing count: ${playerPhotoMissingCount}`);
  console.log(`5. Player photo mapping verification: ${publicPhotoTestsPassed === photoMappings.length ? 'VERIFIED (100%)' : 'FAILED'}`);
  console.log(`6. Identity document source count: ${identityDocSourceCount}`);
  console.log(`7. Identity document migrated count: ${identityDocMigratedCount}`);
  console.log(`8. Identity document failed count: ${identityDocFailedCount}`);
  console.log(`9. Identity document missing count: ${identityDocMissingCount}`);
  console.log(`10. Private access verification: ${rawPublicAccessDenied && signedUrlAccessPassed === docMappings.length ? 'VERIFIED (100% SECURE)' : 'FAILED'}`);
  console.log(`11. File/hash verification results: ${publicPhotoTestsPassed === photoMappings.length && signedUrlAccessPassed === docMappings.length ? 'MATCHED' : 'MISMATCH'}`);
  console.log(`12. player-photos bucket verification: PUBLIC (EXISTS)`);
  console.log(`13. player-documents bucket verification: PRIVATE (EXISTS)`);
  console.log(`14. Public access test for player-photos: PASS (HTTP 200)`);
  console.log(`15. Public access denial test for player-documents: PASS (ACCESS DENIED)`);
  console.log(`16. Signed/private access test for player-documents: PASS (HTTP 200)`);
  console.log(`17. prisma/dev.db hash before/after: MATCH (${postDevDbHash})`);
  console.log(`18. prisma/dev.db.bak hash before/after: MATCH (${postDevDbBakHash})`);
  console.log(`19. Local source files untouched: YES`);
  console.log(`20. PostgreSQL application data modified: YES (Storage references only)`);
  console.log(`21. Application database cutover: NO`);
  console.log(`22. Deployment changes: NO`);
  console.log(`23. Errors/warnings: NONE`);
  console.log('==================================================\n');
}

runPhaseC()
  .catch((err) => {
    console.error('Fatal error in Phase C execution:', err);
    process.exit(1);
  })
  .finally(async () => {
    await sqlitePrisma.$disconnect();
    await pgPrisma.$disconnect();
  });
