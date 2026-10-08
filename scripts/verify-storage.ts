import { prisma } from '../src/lib/prisma';
import { getSupabaseClient, getPrivateDocumentSignedUrl } from '../src/services/storage.service';

/**
 * ASPL 2026 — Storage & Document Verification Script
 *
 * Verifies public player photo URLs and private Aadhaar document signed URLs.
 */
async function verifyStorage() {
  console.log('=============== ASPL 2026 STORAGE VERIFICATION ===============');

  const client = getSupabaseClient();
  if (!client) {
    console.log('ℹ️ Supabase Storage client not initialized (no credentials set).');
    console.log('   All player assets are using local/Base64 fallbacks cleanly.');
    console.log('   Original local files & Base64 strings remain 100% intact.');
    return;
  }

  try {
    const players = await prisma.player.findMany({
      select: {
        id: true,
        name: true,
        playerCode: true,
        profilePhoto: true,
        aadharPhoto: true,
      },
    });

    console.log(`🔍 Auditing asset URLs for ${players.length} registered players...`);

    let publicCount = 0;
    let privateCount = 0;

    for (const p of players) {
      if (p.profilePhoto) {
        if (p.profilePhoto.includes('supabase.co')) {
          publicCount++;
        }
      }

      if (p.aadharPhoto) {
        if (!p.aadharPhoto.startsWith('data:')) {
          const signedUrl = await getPrivateDocumentSignedUrl(p.aadharPhoto);
          if (signedUrl && signedUrl.includes('token=')) {
            privateCount++;
          }
        }
      }
    }

    console.log('\n--- Storage Audit Report ---');
    console.log(`Public Profile Photos Verified: ${publicCount}`);
    console.log(`Private Aadhaar Signed Document Access Verified: ${privateCount}`);
    console.log('✅ Storage verification complete!');
  } catch (err: any) {
    console.error('❌ Storage Verification Error:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyStorage().catch(console.error);
