import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient as SqlitePrismaClient } from '@prisma/client-sqlite';
import { PrismaClient as PgPrismaClient } from '@prisma/client-postgresql';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function calculateFileHash(filePath: string): string {
  if (!fs.existsSync(filePath)) return 'FILE_NOT_FOUND';
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(fileBuffer).digest('hex');
}

async function runPhaseBMigration() {
  console.log('================ PHASE B — SQLITE TO POSTGRESQL MIGRATION ================');

  const devDbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  const devDbBakPath = path.join(process.cwd(), 'prisma', 'dev.db.bak');

  // --- PRE-CHECK 1: File Existence & Integrity ---
  if (!fs.existsSync(devDbPath) || !fs.existsSync(devDbBakPath)) {
    console.error('❌ CRITICAL ERROR: Dev DB or Backup DB missing!');
    process.exit(1);
  }

  const preHashDevDb = calculateFileHash(devDbPath);
  const preHashDevDbBak = calculateFileHash(devDbBakPath);

  console.log('🛡️ Pre-Migration File Integrity:');
  console.log(`   prisma/dev.db SHA-256:     ${preHashDevDb}`);
  console.log(`   prisma/dev.db.bak SHA-256: ${preHashDevDbBak}`);

  // --- PRE-CHECK 2: Source SQLite Baseline Row Counts ---
  const sqliteDb = new SqlitePrismaClient({
    datasources: { db: { url: `file:${devDbPath}` } },
  });

  const sqliteCounts = {
    User: await sqliteDb.user.count(),
    Team: await sqliteDb.team.count(),
    Player: await sqliteDb.player.count(),
    Payment: await sqliteDb.payment.count(),
    OwnerInvitation: await sqliteDb.ownerInvitation.count(),
    Auction: await sqliteDb.auction.count(),
    Bid: await sqliteDb.bid.count(),
    AuctionResult: await sqliteDb.auctionResult.count(),
    WhatsappNotification: await sqliteDb.whatsappNotification.count(),
    Notification: await sqliteDb.notification.count(),
    AuditLog: await sqliteDb.auditLog.count(),
    Match: await sqliteDb.match.count(),
  };

  console.log('\n📊 Source SQLite Row Counts:');
  console.table(sqliteCounts);

  // --- PRE-CHECK 3: Target PostgreSQL 0-Record Baseline Check ---
  const pgTargetUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!pgTargetUrl || pgTargetUrl.startsWith('file:')) {
    console.error('❌ ERROR: PostgreSQL connection string missing in .env!');
    process.exit(1);
  }

  const pgDb = new PgPrismaClient({
    datasources: { db: { url: pgTargetUrl } },
  });

  const pgPreCounts = {
    User: await pgDb.user.count(),
    Team: await pgDb.team.count(),
    Player: await pgDb.player.count(),
    Payment: await pgDb.payment.count(),
    OwnerInvitation: await pgDb.ownerInvitation.count(),
    Auction: await pgDb.auction.count(),
    Bid: await pgDb.bid.count(),
    AuctionResult: await pgDb.auctionResult.count(),
    WhatsappNotification: await pgDb.whatsappNotification.count(),
    Notification: await pgDb.notification.count(),
    AuditLog: await pgDb.auditLog.count(),
    Match: await pgDb.match.count(),
  };

  console.log('\n📊 Target PostgreSQL Pre-Migration Row Counts (Expected 0):');
  console.table(pgPreCounts);

  const nonZeroTables = Object.entries(pgPreCounts).filter(([_, count]) => count > 0);
  if (nonZeroTables.length > 0) {
    console.error('❌ STOP: Target PostgreSQL contains pre-existing records:', nonZeroTables);
    process.exit(1);
  }

  console.log('\n--- Step 1: Executing Topological Data Migration ---');

  try {
    // 1. Users
    const users = await sqliteDb.user.findMany();
    for (const u of users) {
      await pgDb.user.create({ data: u });
    }
    console.log(`   ✅ Migrated Users: ${users.length}`);

    // 2. Teams
    const teams = await sqliteDb.team.findMany();
    for (const t of teams) {
      await pgDb.team.create({ data: t });
    }
    console.log(`   ✅ Migrated Teams: ${teams.length}`);

    // 3. Players
    const players = await sqliteDb.player.findMany();
    for (const p of players) {
      await pgDb.player.create({ data: p });
    }
    console.log(`   ✅ Migrated Players: ${players.length}`);

    // 4. Payments
    const payments = await sqliteDb.payment.findMany();
    for (const pay of payments) {
      await pgDb.payment.create({ data: pay });
    }
    console.log(`   ✅ Migrated Payments: ${payments.length}`);

    // 5. OwnerInvitations
    const invitations = await sqliteDb.ownerInvitation.findMany();
    for (const inv of invitations) {
      await pgDb.ownerInvitation.create({ data: inv });
    }
    console.log(`   ✅ Migrated Owner Invitations: ${invitations.length}`);

    // 6. Auctions
    const auctions = await sqliteDb.auction.findMany();
    for (const a of auctions) {
      await pgDb.auction.create({ data: a });
    }
    console.log(`   ✅ Migrated Auctions: ${auctions.length}`);

    // 7. Bids
    const bids = await sqliteDb.bid.findMany();
    for (const b of bids) {
      await pgDb.bid.create({ data: b });
    }
    console.log(`   ✅ Migrated Bids: ${bids.length}`);

    // 8. AuctionResults
    const results = await sqliteDb.auctionResult.findMany();
    for (const r of results) {
      await pgDb.auctionResult.create({ data: r });
    }
    console.log(`   ✅ Migrated Auction Results: ${results.length}`);

    // 9. WhatsappNotifications
    const waNotifs = await sqliteDb.whatsappNotification.findMany();
    for (const wa of waNotifs) {
      await pgDb.whatsappNotification.create({ data: wa });
    }
    console.log(`   ✅ Migrated WhatsApp Notifications: ${waNotifs.length}`);

    // 10. Notifications
    const notifs = await sqliteDb.notification.findMany();
    for (const n of notifs) {
      await pgDb.notification.create({ data: n });
    }
    console.log(`   ✅ Migrated Generic Notifications: ${notifs.length}`);

    // 11. AuditLogs
    const auditLogs = await sqliteDb.auditLog.findMany();
    for (const log of auditLogs) {
      await pgDb.auditLog.create({ data: log });
    }
    console.log(`   ✅ Migrated Audit Logs: ${auditLogs.length}`);

    // 12. Matches
    const matches = await sqliteDb.match.findMany();
    for (const m of matches) {
      await pgDb.match.create({ data: m });
    }
    console.log(`   ✅ Migrated Matches: ${matches.length}`);

    console.log('\n--- Step 2: Post-Migration Row Count Comparison ---');
    const pgPostCounts = {
      User: await pgDb.user.count(),
      Team: await pgDb.team.count(),
      Player: await pgDb.player.count(),
      Payment: await pgDb.payment.count(),
      OwnerInvitation: await pgDb.ownerInvitation.count(),
      Auction: await pgDb.auction.count(),
      Bid: await pgDb.bid.count(),
      AuctionResult: await pgDb.auctionResult.count(),
      WhatsappNotification: await pgDb.whatsappNotification.count(),
      Notification: await pgDb.notification.count(),
      AuditLog: await pgDb.auditLog.count(),
      Match: await pgDb.match.count(),
    };

    console.table([
      { Model: 'User', SQLite: sqliteCounts.User, PostgreSQL: pgPostCounts.User, Match: sqliteCounts.User === pgPostCounts.User ? 'PASS ✅' : 'FAIL ❌' },
      { Model: 'Team', SQLite: sqliteCounts.Team, PostgreSQL: pgPostCounts.Team, Match: sqliteCounts.Team === pgPostCounts.Team ? 'PASS ✅' : 'FAIL ❌' },
      { Model: 'Player', SQLite: sqliteCounts.Player, PostgreSQL: pgPostCounts.Player, Match: sqliteCounts.Player === pgPostCounts.Player ? 'PASS ✅' : 'FAIL ❌' },
      { Model: 'Payment', SQLite: sqliteCounts.Payment, PostgreSQL: pgPostCounts.Payment, Match: sqliteCounts.Payment === pgPostCounts.Payment ? 'PASS ✅' : 'FAIL ❌' },
      { Model: 'OwnerInvitation', SQLite: sqliteCounts.OwnerInvitation, PostgreSQL: pgPostCounts.OwnerInvitation, Match: sqliteCounts.OwnerInvitation === pgPostCounts.OwnerInvitation ? 'PASS ✅' : 'FAIL ❌' },
      { Model: 'Auction', SQLite: sqliteCounts.Auction, PostgreSQL: pgPostCounts.Auction, Match: sqliteCounts.Auction === pgPostCounts.Auction ? 'PASS ✅' : 'FAIL ❌' },
      { Model: 'Bid', SQLite: sqliteCounts.Bid, PostgreSQL: pgPostCounts.Bid, Match: sqliteCounts.Bid === pgPostCounts.Bid ? 'PASS ✅' : 'FAIL ❌' },
      { Model: 'AuctionResult', SQLite: sqliteCounts.AuctionResult, PostgreSQL: pgPostCounts.AuctionResult, Match: sqliteCounts.AuctionResult === pgPostCounts.AuctionResult ? 'PASS ✅' : 'FAIL ❌' },
      { Model: 'WhatsappNotification', SQLite: sqliteCounts.WhatsappNotification, PostgreSQL: pgPostCounts.WhatsappNotification, Match: sqliteCounts.WhatsappNotification === pgPostCounts.WhatsappNotification ? 'PASS ✅' : 'FAIL ❌' },
      { Model: 'Notification', SQLite: sqliteCounts.Notification, PostgreSQL: pgPostCounts.Notification, Match: sqliteCounts.Notification === pgPostCounts.Notification ? 'PASS ✅' : 'FAIL ❌' },
      { Model: 'AuditLog', SQLite: sqliteCounts.AuditLog, PostgreSQL: pgPostCounts.AuditLog, Match: sqliteCounts.AuditLog === pgPostCounts.AuditLog ? 'PASS ✅' : 'FAIL ❌' },
      { Model: 'Match', SQLite: sqliteCounts.Match, PostgreSQL: pgPostCounts.Match, Match: sqliteCounts.Match === pgPostCounts.Match ? 'PASS ✅' : 'FAIL ❌' },
    ]);

    // --- Step 3: Relationship & Foreign Key Integrity Audit ---
    console.log('\n--- Step 3: Relationship & Foreign Key Integrity Audit ---');
    const playerUserCheck = await pgDb.player.count({ where: { user: { is: null as any } } });
    const teamOwnerCheck = await pgDb.team.count({ where: { ownerUserId: { not: null }, owner: { is: null as any } } });
    const bidAuctionCheck = await pgDb.bid.count({ where: { auction: { is: null as any } } });
    const bidTeamCheck = await pgDb.bid.count({ where: { team: { is: null as any } } });
    const resultPlayerCheck = await pgDb.auctionResult.count({ where: { player: { is: null as any } } });
    const paymentPlayerCheck = await pgDb.payment.count({ where: { player: { is: null as any } } });

    console.log(`   Player -> User Relationship: ${playerUserCheck === 0 ? 'VALID ✅ (0 Orphans)' : 'INVALID ❌'}`);
    console.log(`   Team -> Owner Relationship: ${teamOwnerCheck === 0 ? 'VALID ✅ (0 Orphans)' : 'INVALID ❌'}`);
    console.log(`   Bid -> Auction Relationship: ${bidAuctionCheck === 0 ? 'VALID ✅ (0 Orphans)' : 'INVALID ❌'}`);
    console.log(`   Bid -> Team Relationship:    ${bidTeamCheck === 0 ? 'VALID ✅ (0 Orphans)' : 'INVALID ❌'}`);
    console.log(`   AuctionResult -> Player:     ${resultPlayerCheck === 0 ? 'VALID ✅ (0 Orphans)' : 'INVALID ❌'}`);
    console.log(`   Payment -> Player:           ${paymentPlayerCheck === 0 ? 'VALID ✅ (0 Orphans)' : 'INVALID ❌'}`);

    // --- Step 4: Field-by-Field Representative Data Comparison ---
    console.log('\n--- Step 4: Representative Field-by-Field Record Verification ---');
    const samplePlayerSqlite = await sqliteDb.player.findFirst({ orderBy: { createdAt: 'desc' } });
    if (samplePlayerSqlite) {
      const samplePlayerPg = await pgDb.player.findUnique({ where: { id: samplePlayerSqlite.id } });
      console.log(`   Sample Player ID: ${samplePlayerSqlite.id}`);
      console.log(`   SQLite Name: "${samplePlayerSqlite.name}" <-> PG Name: "${samplePlayerPg?.name}"`);
      console.log(`   SQLite Phone: "${samplePlayerSqlite.phone}" <-> PG Phone: "${samplePlayerPg?.phone}"`);
      console.log(`   SQLite Code: "${samplePlayerSqlite.playerCode}" <-> PG Code: "${samplePlayerPg?.playerCode}"`);
      console.log(`   SQLite Registration Status: "${samplePlayerSqlite.registrationStatus}" <-> PG Status: "${samplePlayerPg?.registrationStatus}"`);
    }

    const samplePaymentSqlite = await sqliteDb.payment.findFirst({ orderBy: { createdAt: 'desc' } });
    if (samplePaymentSqlite) {
      const samplePaymentPg = await pgDb.payment.findUnique({ where: { id: samplePaymentSqlite.id } });
      console.log(`   Sample Payment ID: ${samplePaymentSqlite.id}`);
      console.log(`   SQLite Amount: ${samplePaymentSqlite.amount} <-> PG Amount: ${samplePaymentPg?.amount}`);
      console.log(`   SQLite Status: "${samplePaymentSqlite.status}" <-> PG Status: "${samplePaymentPg?.status}"`);
    }

    // --- Step 5: Post-Migration File Hash Verification ---
    const postHashDevDb = calculateFileHash(devDbPath);
    const postHashDevDbBak = calculateFileHash(devDbBakPath);

    console.log('\n--- Step 5: SQLite Source Immutability Verification ---');
    console.log(`   Pre-Migration dev.db SHA-256:  ${preHashDevDb}`);
    console.log(`   Post-Migration dev.db SHA-256: ${postHashDevDb}`);
    console.log(`   dev.db Hash Match: ${preHashDevDb === postHashDevDb ? 'IDENTICAL / UNTOUCHED ✅' : 'MODIFIED ❌'}`);

    console.log(`   Pre-Migration dev.db.bak SHA-256:  ${preHashDevDbBak}`);
    console.log(`   Post-Migration dev.db.bak SHA-256: ${postHashDevDbBak}`);
    console.log(`   dev.db.bak Hash Match: ${preHashDevDbBak === postHashDevDbBak ? 'IDENTICAL / UNTOUCHED ✅' : 'MODIFIED ❌'}`);

  } catch (err: any) {
    console.error('❌ Phase B Migration Error:', err.message);
  } finally {
    await sqliteDb.$disconnect();
    await pgDb.$disconnect();
  }
}

runPhaseBMigration().catch(console.error);
