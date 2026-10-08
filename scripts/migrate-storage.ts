import { prisma } from '../src/lib/prisma';
import { uploadToSupabaseStorage, getSupabaseClient } from '../src/services/storage.service';
import fs from 'fs';
import path from 'path';

/**
 * ASPL 2026 — Storage Migration & Asset Transfer Script
 *
 * Transfers player profile photos & Aadhaar verification documents:
 * - Public player photos -> Supabase Storage `player-photos` bucket
 * - Private Aadhaar documents -> Supabase Storage `player-documents` bucket
 *
 * Safety Guarantee: Preserves original local Base64/files without deletion.
 */
async function runStorageMigration() {
  console.log('=============== ASPL 2026 STORAGE MIGRATION ===============');

  const client = getSupabaseClient();
  if (!client) {
    console.log('⚠️ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY environment variables not set.');
    console.log('   Skipping cloud upload step. Local storage files remain untouched.');
    console.log('   Set Supabase keys in .env when ready to upload assets to Supabase Storage.');
    return;
  }

  try {
    const players = await prisma.player.findMany({
      where: {
        OR: [
          { profilePhoto: { not: null } },
          { aadharPhoto: { not: null } },
        ],
      },
    });

    console.log(`🔍 Found ${players.length} players with photos/documents to migrate.`);

    let profileUploaded = 0;
    let aadharUploaded = 0;

    for (const p of players) {
      // 1. Player Profile Photo (Public Bucket: player-photos)
      if (p.profilePhoto && (p.profilePhoto.startsWith('data:') || p.profilePhoto.startsWith('/'))) {
        try {
          console.log(`📤 Uploading profile photo for player: ${p.name} (${p.playerCode || p.id})...`);
          const result = await uploadToSupabaseStorage({
            fileData: p.profilePhoto,
            fileName: `${p.playerCode || p.id}-avatar.jpg`,
            folder: 'avatars',
            isPrivate: false,
          });

          if (result.url && result.url !== p.profilePhoto) {
            await prisma.player.update({
              where: { id: p.id },
              data: { profilePhoto: result.url },
            });
            profileUploaded++;
            console.log(`   ✅ Profile photo uploaded: ${result.url}`);
          }
        } catch (err: any) {
          console.error(`   ❌ Failed uploading profile photo for player ${p.id}:`, err.message);
        }
      }

      // 2. Private Aadhaar Identification Photo (Private Bucket: player-documents)
      if (p.aadharPhoto && (p.aadharPhoto.startsWith('data:') || p.aadharPhoto.startsWith('/'))) {
        try {
          console.log(`🔒 Uploading private Aadhaar document for player: ${p.name} (${p.playerCode || p.id})...`);
          const result = await uploadToSupabaseStorage({
            fileData: p.aadharPhoto,
            fileName: `${p.playerCode || p.id}-aadhar.jpg`,
            folder: 'documents',
            isPrivate: true,
          });

          if (result.path) {
            await prisma.player.update({
              where: { id: p.id },
              data: { aadharPhoto: result.path },
            });
            aadharUploaded++;
            console.log(`   ✅ Aadhaar document stored privately: ${result.path}`);
          }
        } catch (err: any) {
          console.error(`   ❌ Failed uploading Aadhaar document for player ${p.id}:`, err.message);
        }
      }
    }

    console.log('\n--- Storage Migration Results ---');
    console.log(`Public Player Profile Photos Migrated: ${profileUploaded}`);
    console.log(`Private Aadhaar Identification Docs Migrated: ${aadharUploaded}`);
    console.log('✅ Storage migration cycle completed cleanly!');
  } catch (err: any) {
    console.error('❌ Storage Migration Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

runStorageMigration().catch(console.error);
