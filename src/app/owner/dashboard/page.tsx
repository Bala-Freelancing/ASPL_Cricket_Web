'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Trophy,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Users,
  Sparkles,
  Gavel,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';

export default function OwnerDashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [currentAuction, setCurrentAuction] = useState<any>(null);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [socket, setSocket] = useState<any>(null);
  const [imgError, setImgError] = useState(false);

  const [loading, setLoading] = useState(false);
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState('');

  const API_URL = API_BASE_URL;

  const fetchSessionAndTeam = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    if (!token) {
      window.location.href = '/login';
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setTeam(data.user.team);
      }
    } catch (err) {
      const cachedUserRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (cachedUserRaw) {
        try {
          const cachedUser = JSON.parse(cachedUserRaw);
          if (cachedUser) {
            setUser(cachedUser);
            setTeam(cachedUser.team || {
              id: 'csk-team-id',
              name: 'Chennai Super Kings',
              shortCode: 'CSK',
              initialPurse: 10000000,
              remainingPurse: 9800000,
              maxSquadSize: 15,
            });
          }
        } catch (e) {}
      }
    }
  };

  useEffect(() => {
    fetchSessionAndTeam();

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['polling', 'websocket'],
    });

    newSocket.emit('auction:join');

    newSocket.on('auction:state_sync', (data: any) => {
      if (data && data.auction) setCurrentAuction(data.auction);
    });

    newSocket.on('auction:started', (auction: any) => {
      setCurrentAuction(auction);
      setTimerSeconds(30);
      setBidError('');
      setBidSuccess('');
      setImgError(false);
    });

    newSocket.on('auction:bid_placed', (data: any) => {
      setCurrentAuction(data.auction);
      setTimerSeconds(60);
      if (data.winningTeam?.id === team?.id) {
        setBidSuccess(`Your bid of ₹${data.bid.amount.toLocaleString()} was accepted!`);
        setBidError('');
      }
    });

    newSocket.on('auction:bid_rejected', (data: any) => {
      setBidError(data.message || 'Bid rejected by server');
      setBidSuccess('');
    });

    newSocket.on('auction:timer_tick', (data: any) => {
      setTimerSeconds(data.remainingSeconds);
    });

    newSocket.on('auction:sold', () => {
      setCurrentAuction(null);
      fetchSessionAndTeam();
    });

    newSocket.on('auction:unsold', () => {
      setCurrentAuction(null);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [team?.id]);

  useEffect(() => {
    setImgError(false);
  }, [currentAuction?.player?.id]);

  const calculateNextBid = () => {
    if (!currentAuction) return 0;
    if (currentAuction.currentBid === 0) return currentAuction.basePrice;
    return currentAuction.currentBid + currentAuction.minIncrement;
  };

  const handlePlaceBid = async () => {
    if (!currentAuction || !team) return;
    setLoading(true);
    setBidError('');
    setBidSuccess('');

    const nextAmount = calculateNextBid();
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';

    try {
      const res = await fetch(`${API_URL}/api/auction/bid`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          auctionId: currentAuction.id,
          amount: nextAmount,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to place bid');
      }

      if (data.auction) {
        setCurrentAuction(data.auction);
        setBidSuccess(`Your bid of ₹${nextAmount.toLocaleString()} was accepted!`);
      }
    } catch (err: any) {
      setBidError(err.message || 'Error placing bid');
    } finally {
      setLoading(false);
    }
  };

  const isHighestBidder = currentAuction && team && currentAuction.currentWinningTeamId === team.id;
  const nextBidAmount = calculateNextBid();
  const canAfford = team && team.remainingPurse >= nextBidAmount;

  const squadLength = team?.players ? team.players.length : 0;
  const maxSquad = team?.maxSquadSize || 15;
  const pursePercentage = team ? Math.round((team.remainingPurse / team.initialPurse) * 100) : 100;

  const player = currentAuction?.player;
  const photoUrl = player?.profilePhoto || player?.photo_url || player?.photoUrl || null;

  return (
    <div className="h-[calc(100vh-5rem)] overflow-hidden bg-[#05070D] text-[#F8FAFC] p-3 sm:p-4 flex flex-col justify-between gap-3">
      {/* TEAM HEADER & PURSE STATUS BAR */}
      {team && (
        <div className="bg-[#0B101C] border border-[#FFC928]/30 rounded-xl px-4 py-3 space-y-2 shrink-0 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFC928] text-[#05070D] font-black flex items-center justify-center font-mono text-base shadow-lg shadow-[#FFC928]/10">
                {team.shortCode}
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#FFC928] uppercase tracking-wider block leading-none">
                  TEAM OWNER CONSOLE
                </span>
                <h1 className="text-lg sm:text-xl font-black text-white mt-0.5">{team.name}</h1>
              </div>
            </div>

            <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end text-xs">
              <div>
                <span className="text-[9px] font-bold text-[#94A3B8] uppercase block">Auction Purse</span>
                <div className="text-xl font-black text-[#FFC928] font-mono">
                  {team.remainingPurse.toLocaleString()} <span className="text-xs font-bold text-amber-400">Credits</span>
                </div>
              </div>

              <div className="border-l border-white/[0.08] pl-6">
                <span className="text-[9px] font-bold text-[#94A3B8] uppercase block">Squad Capacity</span>
                <div className="text-xl font-black text-white font-mono">
                  {squadLength} <span className="text-[#94A3B8] text-xs">/ {maxSquad}</span>
                </div>
              </div>
            </div>
          </div>

          {/* PURSE BUDGET PROGRESS BAR */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-[#94A3B8] font-semibold">
              <span>Credits Remaining: {pursePercentage}%</span>
              <span>Initial ASPL Credit Allocation: {team.initialPurse.toLocaleString()} Credits</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#05070D] border border-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-[#FFC928] rounded-full transition-all duration-500"
                style={{ width: `${pursePercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE BIDDING ARENA */}
      {currentAuction && player ? (
        <div className="bg-[#0B101C] border border-[#FFC928]/40 rounded-xl p-4 flex-1 min-h-0 flex flex-col justify-between gap-3 shadow-2xl relative overflow-hidden">
          {/* HEADER ROW */}
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span className="text-xs font-black text-[#FFC928] uppercase tracking-widest">LIVE AUCTION LOT</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#05070D] border border-white/[0.08]">
              <Clock className="w-3.5 h-3.5 text-[#FFC928]" />
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Timer:</span>
              <span
                className={`text-base font-mono font-black ${
                  timerSeconds <= 10 ? 'text-rose-500 animate-pulse' : 'text-[#FFC928]'
                }`}
              >
                ⏱ {timerSeconds}s
              </span>
            </div>
          </div>

          {/* MAIN BIDDING BODY GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0 items-stretch">
            {/* LEFT: PLAYER CARD & PHOTO (COL 5) */}
            <div className="lg:col-span-5 bg-[#080D19] border border-white/[0.08] rounded-xl p-3 flex flex-col justify-between gap-2 min-h-0">
              {/* Photo Frame - Full Height */}
              <div className="relative w-full flex-1 min-h-[180px] rounded-lg bg-[#05070D] border border-[#FFC928]/20 overflow-hidden flex items-center justify-center">
                {photoUrl && !imgError ? (
                  <img
                    src={photoUrl}
                    alt={player.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-[#05070D] flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-[#FFC928]/10 border border-[#FFC928]/30 text-[#FFC928] text-3xl font-black flex items-center justify-center">
                      {player.name ? player.name[0].toUpperCase() : 'P'}
                    </div>
                  </div>
                )}
              </div>

              {/* Player Stats */}
              <div className="space-y-1.5 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#FFC928]">
                    LOT #{player.playerCode || 'IPL26-P0000'}
                  </span>
                  <span className="text-[10px] text-[#94A3B8] bg-[#05070D] px-2 py-0.5 rounded border border-white/[0.06]">
                    Age: {player.age || '24'}
                  </span>
                </div>

                <h2 className="text-lg font-black text-white truncate">{player.name}</h2>

                <div className="grid grid-cols-3 gap-2 text-[10px] text-[#94A3B8]">
                  <div className="p-1.5 rounded-lg bg-[#05070D] border border-white/[0.06]">
                    <span className="block text-[8px] uppercase">Category</span>
                    <strong className="text-white font-bold truncate block">{player.category}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#05070D] border border-white/[0.06]">
                    <span className="block text-[8px] uppercase">Batting</span>
                    <strong className="text-white font-bold truncate block">{player.battingStyle}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#05070D] border border-white/[0.06]">
                    <span className="block text-[8px] uppercase">Bowling</span>
                    <strong className="text-white font-bold truncate block">{player.bowlingStyle}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: CURRENT BID & PROMINENT NEON GOLD BID BUTTON (COL 7) */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-3 min-h-0">
              {/* CURRENT BID CARD */}
              <div className="bg-[#080D19] border border-[#FFC928]/35 rounded-xl p-5 text-center flex-1 flex flex-col justify-center gap-2 shadow-xl">
                <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-widest block">
                  CURRENT HIGHEST BID
                </span>

                <div className="text-4xl sm:text-5xl font-black text-[#FFC928] font-mono tracking-tight my-1">
                  {currentAuction.currentBid > 0
                    ? currentAuction.currentBid.toLocaleString()
                    : currentAuction.basePrice.toLocaleString()} <span className="text-xl font-bold text-[#FFC928]">Credits</span>
                </div>

                <div className="pt-2 border-t border-white/[0.08]">
                  <span className="text-xs text-[#94A3B8]">Winning Bidder: </span>
                  <strong className="text-white font-extrabold text-sm">
                    {currentAuction.currentWinningTeam ? currentAuction.currentWinningTeam.name : 'None'}
                  </strong>
                </div>
              </div>

              {/* MESSAGES */}
              {bidError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold shrink-0 text-center">
                  ⚠️ {bidError}
                </div>
              )}
              {bidSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shrink-0 text-center">
                  ✅ {bidSuccess}
                </div>
              )}

              {/* PROMINENT NEON GOLD PLACE BID BUTTON */}
              <button
                type="button"
                onClick={handlePlaceBid}
                disabled={loading || isHighestBidder || !canAfford}
                className={`w-full py-4 px-6 rounded-xl font-black text-sm sm:text-base tracking-wide transition-all shadow-xl flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
                  isHighestBidder
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-not-allowed'
                    : !canAfford
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 cursor-not-allowed'
                    : 'bg-[#FFC928] hover:bg-[#ffe066] text-[#05070D] shadow-[#FFC928]/20'
                }`}
              >
                <Gavel className="w-5 h-5" />
                <span>
                  {isHighestBidder
                    ? 'YOU ARE HIGHEST BIDDER'
                    : !canAfford
                    ? 'INSUFFICIENT ASPL CREDITS'
                    : `PLACE BID (${nextBidAmount.toLocaleString()} Credits)`}
                </span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* IDLE AUCTION STATE */
        <div className="bg-[#0B101C] border border-white/[0.08] rounded-xl p-8 text-center space-y-3 my-auto max-w-md mx-auto shadow-2xl">
          <Trophy className="w-12 h-12 text-[#FFC928] mx-auto animate-pulse" />
          <h2 className="text-xl font-black text-white">No Active Auction Lot</h2>
          <p className="text-xs text-[#94A3B8]">Waiting for Admin to open the next player lot...</p>
        </div>
      )}

      {/* ASPL CREDITS NON-MONETARY INFORMATION BANNER */}
      <div className="bg-[#0B101C] border border-amber-500/30 rounded-xl p-3 text-[11px] text-[#94A3B8] flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-[#FFC928] shrink-0" />
        <div>
          <strong className="text-white font-bold">ASPL Auction Credits: </strong>
          <span>ASPL Credits are non-monetary tournament credits allocated by ASPL for player selection during the ASPL 2026 auction. Credits have no cash value and cannot be purchased, transferred, withdrawn, refunded, redeemed, or exchanged for money. Credits are used exclusively for tournament squad selection.</span>
        </div>
      </div>

      {/* PURCHASED SQUAD ROSTER SECTION */}
      {team && (
        <div className="bg-[#0B101C] border border-[#FFC928]/30 rounded-xl p-3 space-y-2 shrink-0 shadow-xl overflow-hidden">
          <div className="flex items-center justify-between text-xs border-b border-white/[0.08] pb-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <Users className="w-4 h-4 text-[#FFC928]" />
              <span className="uppercase tracking-wide text-[11px]">
                PURCHASED SQUAD ROSTER ({squadLength} / {maxSquad} PLAYERS)
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-[#94A3B8]">
              <span>Purchased: <strong className="text-white font-mono">{squadLength}</strong></span>
              <span>Remaining Credits: <strong className="text-[#FFC928] font-mono">{team.remainingPurse.toLocaleString()} Credits</strong></span>
            </div>
          </div>

          {/* PURCHASED PLAYERS CARDS TRACK */}
          {team.players && team.players.length > 0 ? (
            <div className="flex items-center gap-3 overflow-x-auto py-1 max-h-[115px]">
              {team.players.map((p: any) => (
                <div
                  key={p.id}
                  className="bg-[#080D19] border border-[#FFC928]/25 hover:border-[#FFC928]/60 rounded-xl p-2.5 flex items-center gap-3 min-w-[240px] shrink-0 shadow-md transition-all group"
                >
                  {/* Photo Frame with Fallback */}
                  <div className="w-12 h-12 rounded-lg bg-[#05070D] border border-[#FFC928]/30 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                    {p.profilePhoto ? (
                      <img
                        src={p.profilePhoto}
                        alt={p.name}
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                        onError={(e: any) => {
                          e.target.onerror = null;
                          e.target.src = '';
                          e.target.parentElement.innerHTML = `<div class="w-full h-full bg-[#FFC928]/10 text-[#FFC928] font-black text-base flex items-center justify-center">${p.name ? p.name[0].toUpperCase() : 'P'}</div>`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#FFC928]/10 text-[#FFC928] font-black text-base flex items-center justify-center">
                        {p.name ? p.name[0].toUpperCase() : 'P'}
                      </div>
                    )}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-black text-white truncate group-hover:text-[#FFC928] transition-colors">
                        {p.name}
                      </h4>
                    </div>

                    <div className="text-[10px] text-[#94A3B8] truncate mt-0.5">
                      <span className="font-semibold text-white">{p.category || 'Cricket Player'}</span>
                      {p.battingStyle ? ` • ${p.battingStyle}` : ''}
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[11px]">
                      <span className="text-[9px] font-mono text-[#94A3B8]">{p.playerCode || ''}</span>
                      <span className="font-mono font-black text-[#FFC928] bg-[#FFC928]/10 px-2 py-0.5 rounded border border-[#FFC928]/20">
                        {p.winningBid ? `${p.winningBid.toLocaleString()} Credits` : '0 Credits'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-3 text-xs text-[#94A3B8] italic bg-[#080D19]/50 rounded-lg border border-dashed border-white/[0.06]">
              No players purchased yet. Place winning bids during live auction lots to build your squad!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

