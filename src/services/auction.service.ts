import { prisma } from '../lib/prisma';
import { CONFIG } from '../lib/config';

export interface PlaceBidInput {
  auctionId: string;
  teamOwnerUserId: string;
  amount: number;
}

export interface StartAuctionInput {
  playerId: string;
  basePrice?: number;
  minIncrement?: number;
}

/**
 * Starts a live auction for an available player (Admin Action).
 */
export async function startAuction({ playerId, basePrice, minIncrement }: StartAuctionInput) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
  });

  if (!player) {
    throw new Error('Player not found');
  }

  // Ensure player is verified and available for auction
  if (player.auctionStatus === 'SOLD') {
    throw new Error('Player is already SOLD and cannot be re-auctioned');
  }

  const existingActiveAuction = await prisma.auction.findFirst({
    where: { state: { in: ['ACTIVE', 'PAUSED'] } },
    include: { player: true, currentWinningTeam: true },
  });

  if (existingActiveAuction) {
    if (existingActiveAuction.playerId === playerId) {
      return existingActiveAuction;
    }
    throw new Error('An auction is already currently active for another player. Complete or pause it first.');
  }

  const lotBasePrice = basePrice || player.basePrice || 5000;
  const lotMinIncrement = minIncrement || CONFIG.MIN_BID_INCREMENT;
  const timerExpiresAt = new Date(Date.now() + CONFIG.AUCTION_TIMER_SECONDS * 1000);

  await prisma.player.update({
    where: { id: playerId },
    data: { auctionStatus: 'LIVE_AUCTION' },
  });

  const auction = await prisma.auction.create({
    data: {
      playerId,
      state: 'ACTIVE',
      basePrice: lotBasePrice,
      minIncrement: lotMinIncrement,
      currentBid: 0,
      timerExpiresAt,
      startedAt: new Date(),
    },
    include: { player: true, currentWinningTeam: true },
  });

  return auction;
}

/**
 * Atomic Bid Processor. Handles concurrent bidding with strict database constraints.
 */
export async function placeBid({ auctionId, teamOwnerUserId, amount }: PlaceBidInput) {
  // 1. Fetch auction
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: { player: true, currentWinningTeam: true },
  });

  if (!auction || auction.state !== 'ACTIVE') {
    throw new Error('Auction is not active');
  }

  // 2. Identify bidding owner & team
  const team = await prisma.team.findUnique({
    where: { ownerUserId: teamOwnerUserId },
    include: { players: true },
  });

  if (!team) {
    throw new Error('User is not assigned as owner of any registered team');
  }

  // Rule 15: Owners CANNOT bid against themselves
  if (auction.currentWinningTeamId === team.id) {
    throw new Error('Your team is already the current highest bidder');
  }

  // 3. Minimum bid calculation
  const minRequiredBid =
    auction.currentBid === 0
      ? auction.basePrice
      : auction.currentBid + auction.minIncrement;

  if (amount < minRequiredBid) {
    throw new Error(`Bid amount ₹${amount} must be at least ₹${minRequiredBid}`);
  }

  // 4. Team purse validation
  if (team.remainingPurse < amount) {
    throw new Error(`Insufficient team purse balance (Remaining: ₹${team.remainingPurse})`);
  }

  // 5. Squad size validation
  if (team.players.length >= team.maxSquadSize) {
    throw new Error(`Squad full! Team already reached max limit of ${team.maxSquadSize} players`);
  }

  // 6. Reset timer to 60 seconds upon valid bid
  const newTimerExpiresAt = new Date(Date.now() + CONFIG.BID_TIMER_RESET_SECONDS * 1000);

  // 7. Update Auction state
  const updatedAuction = await prisma.auction.update({
    where: { id: auctionId },
    data: {
      currentBid: amount,
      currentWinningTeamId: team.id,
      timerExpiresAt: newTimerExpiresAt,
    },
    include: { player: true, currentWinningTeam: true },
  });

  // 8. Record immutable Bid log
  const bidLog = await prisma.bid.create({
    data: {
      auctionId,
      playerId: auction.playerId,
      teamId: team.id,
      userId: teamOwnerUserId,
      amount,
    },
  });

  return {
    auction: updatedAuction,
    bid: bidLog,
    team,
  };
}

/**
 * Admin action: Mark current auction lot as SOLD
 */
export async function markLotSold(auctionId: string) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
    include: { player: true, currentWinningTeam: true },
  });

  if (!auction) {
    throw new Error('Auction not found');
  }

  if (!auction.currentWinningTeamId || auction.currentBid === 0) {
    throw new Error('Cannot mark player SOLD without any valid winning bid');
  }

  const winningTeam = await prisma.team.findUnique({
    where: { id: auction.currentWinningTeamId },
  });

  if (!winningTeam) {
    throw new Error('Winning team not found');
  }

  // Deduct remaining purse
  const newRemainingPurse = winningTeam.remainingPurse - auction.currentBid;
  if (newRemainingPurse < 0) {
    throw new Error('Winning team has insufficient purse balance to finalize sale');
  }

  await prisma.team.update({
    where: { id: winningTeam.id },
    data: { remainingPurse: newRemainingPurse },
  });

  // Assign player to team
  const updatedPlayer = await prisma.player.update({
    where: { id: auction.playerId },
    data: {
      assignedTeamId: winningTeam.id,
      winningBid: auction.currentBid,
      auctionStatus: 'SOLD',
    },
  });

  // Update auction state to COMPLETED
  await prisma.auction.update({
    where: { id: auctionId },
    data: {
      state: 'COMPLETED',
      endedAt: new Date(),
    },
  });

  // Store auction result safely (upsert)
  const result = await prisma.auctionResult.upsert({
    where: { auctionId },
    create: {
      auctionId,
      playerId: auction.playerId,
      winningTeamId: winningTeam.id,
      winningBid: auction.currentBid,
      result: 'SOLD',
    },
    update: {
      winningTeamId: winningTeam.id,
      winningBid: auction.currentBid,
      result: 'SOLD',
    },
  });

  return {
    player: updatedPlayer,
    winningTeam,
    winningBid: auction.currentBid,
    result,
  };
}

/**
 * Admin action: Mark current auction lot as UNSOLD
 */
export async function markLotUnsold(auctionId: string) {
  const auction = await prisma.auction.findUnique({
    where: { id: auctionId },
  });

  if (!auction) {
    throw new Error('Auction not found');
  }

  const updatedPlayer = await prisma.player.update({
    where: { id: auction.playerId },
    data: {
      auctionStatus: 'UNSOLD',
    },
  });

  await prisma.auction.update({
    where: { id: auctionId },
    data: {
      state: 'COMPLETED',
      endedAt: new Date(),
    },
  });

  const result = await prisma.auctionResult.upsert({
    where: { auctionId },
    create: {
      auctionId,
      playerId: auction.playerId,
      winningTeamId: null,
      winningBid: null,
      result: 'UNSOLD',
    },
    update: {
      winningTeamId: null,
      winningBid: null,
      result: 'UNSOLD',
    },
  });

  return {
    player: updatedPlayer,
    result,
  };
}

