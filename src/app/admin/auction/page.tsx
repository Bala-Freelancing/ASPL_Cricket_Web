'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import {
  Gavel,
  Clock,
  CheckCircle2,
  XCircle,
  Trophy,
  UserCheck,
  History,
} from 'lucide-react';

export default function AdminAuctionConsolePage() {
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([]);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [currentAuction, setCurrentAuction] = useState<any>(null);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://aspl-cricket-web.onrender.com';

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchAvailablePlayers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/players?status=AVAILABLE`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setAvailablePlayers(data.players || []);
    } catch (err) {}
  };

  const fetchCurrentAuction = async () => {
    try {
      const res = await fetch(`${API_URL}/api/auction/current`);
      const data = await res.json();
      if (data.success && data.auction) {
        setCurrentAuction(data.auction);
      } else {
        setCurrentAuction(null);
      }
    } catch (err) {}
  };

  useEffect(() => {
    fetchAvailablePlayers();
    fetchCurrentAuction();

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const newSocket = io(API_URL, {
      auth: { token },
    });

    newSocket.on('connect', () => setIsConnected(true));
    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.emit('auction:join');

    newSocket.on('auction:state_sync', (data: any) => {
      if (data && data.auction) setCurrentAuction(data.auction);
    });

    newSocket.on('auction:started', (auction: any) => {
      setCurrentAuction(auction);
      setTimerSeconds(30);
      setImgError(false);
    });

    newSocket.on('auction:bid_placed', (data: any) => {
      setCurrentAuction(data.auction);
      setTimerSeconds(60);
    });

    newSocket.on('auction:timer_tick', (data: any) => {
      setTimerSeconds(data.remainingSeconds);
    });

    newSocket.on('auction:sold', () => {
      setCurrentAuction(null);
      fetchAvailablePlayers();
    });

    newSocket.on('auction:unsold', () => {
      setCurrentAuction(null);
      fetchAvailablePlayers();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    setImgError(false);
  }, [currentAuction?.player?.id]);

  const handleStartLot = async () => {
    if (!selectedPlayerId) return;
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auction/start`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ playerId: selectedPlayerId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to start auction lot');

      setCurrentAuction(data.auction);
      setTimerSeconds(30);
      setSelectedPlayerId('');
      setImgError(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMarkSold = async () => {
    if (!currentAuction) return;
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auction/sold`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ auctionId: currentAuction.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to mark SOLD');

      setCurrentAuction(null);
      fetchAvailablePlayers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMarkUnsold = async () => {
    if (!currentAuction) return;
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/auction/unsold`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ auctionId: currentAuction.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to mark UNSOLD');

      setCurrentAuction(null);
      fetchAvailablePlayers();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const player = currentAuction?.player;
  const photoUrl = player?.profilePhoto || player?.photo_url || player?.photoUrl || null;

  return (
    <div className="h-[calc(100vh-5rem)] overflow-hidden bg-[#05070D] text-[#F8FAFC] p-3 sm:p-4 flex flex-col justify-between gap-3">
      {/* COMPACT ADMIN HEADER BAR */}
      <div className="bg-[#0B101C] border border-white/[0.08] rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 shrink-0">
        <div>
          <span className="text-[10px] font-bold text-[#FFC928] uppercase tracking-wider">ASPL 2026 • LIVE AUCTION CONSOLE</span>
          <h1 className="text-base sm:text-lg font-extrabold text-white leading-tight">Auction Control Dashboard</h1>
        </div>

        <div className="flex items-center gap-3">
          {currentAuction && (
            <button
              onClick={handleMarkUnsold}
              className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[#FFC928] text-xs font-bold transition-all cursor-pointer"
            >
              🔄 Change / Select Another Player
            </button>
          )}
          <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#05070D] border border-white/[0.08] text-[11px] font-bold">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
            <span className={isConnected ? 'text-emerald-400' : 'text-rose-400'}>
              {isConnected ? '● REALTIME CONNECTED' : '🔴 DISCONNECTED'}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold shrink-0">
          ⚠️ {error}
        </div>
      )}

      {/* MAIN CONTENT AREA - FIT 100% TO SCREEN */}
      {currentAuction && player ? (
        <div className="flex-1 min-h-0 flex flex-col justify-between gap-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0 items-stretch">
            {/* LEFT / PLAYER CARD (COL 4) */}
            <div className="lg:col-span-4 bg-[#0B101C] border border-white/[0.08] rounded-xl p-3.5 flex flex-col justify-between gap-2 min-h-0">
              {/* Photo Frame - Expands to fill card height */}
              <div className="relative w-full flex-1 min-h-[220px] rounded-xl bg-[#080D19] border border-[#FFC928]/20 overflow-hidden flex items-center justify-center">
                {photoUrl && !imgError ? (
                  <img
                    src={photoUrl}
                    alt={player.name}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full bg-[#080D19] flex items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-[#FFC928]/10 border border-[#FFC928]/30 text-[#FFC928] text-3xl font-black flex items-center justify-center">
                      {player.name ? player.name[0].toUpperCase() : 'P'}
                    </div>
                  </div>
                )}
              </div>

              {/* Player Details */}
              <div className="space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#FFC928]">{player.playerCode || 'LOT IPL26-P0000'}</span>
                  <span className="text-[10px] font-semibold text-[#94A3B8] bg-[#05070D] px-2 py-0.5 rounded border border-white/[0.06]">
                    Age: {player.age || '24'}
                  </span>
                </div>

                <h2 className="text-lg font-black text-white truncate leading-tight">{player.name}</h2>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-[#080D19] border border-white/[0.06]">
                    <span className="block text-[9px] text-[#94A3B8]">Role</span>
                    <strong className="text-white font-bold truncate block">{player.category}</strong>
                  </div>
                  <div className="p-2 rounded-lg bg-[#080D19] border border-white/[0.06]">
                    <span className="block text-[9px] text-[#94A3B8]">Style</span>
                    <strong className="text-white font-bold truncate block">{player.battingStyle}</strong>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-[#05070D] border border-white/[0.06] flex items-center justify-between text-xs">
                  <span className="text-[#94A3B8]">Base Price</span>
                  <span className="font-mono font-bold text-[#FFC928]">₹{currentAuction.basePrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* CENTER / CURRENT BID & TIMER (COL 5) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-3 min-h-0">
              {/* CURRENT HIGHEST BID BOX */}
              <div className="bg-[#0B101C] border border-[#FFC928]/35 rounded-xl p-5 text-center flex-1 flex flex-col justify-center gap-2 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 px-2.5 py-0.5 bg-emerald-500/10 border-l border-b border-emerald-500/30 text-emerald-400 font-bold text-[9px] uppercase tracking-wider">
                  LIVE BIDDING
                </div>

                <span className="text-[11px] font-bold text-[#FFC928] uppercase tracking-widest block">
                  CURRENT HIGHEST BID
                </span>

                <div className="text-4xl sm:text-5xl font-black text-[#FFC928] font-mono tracking-tight my-1">
                  ₹{currentAuction.currentBid > 0 ? currentAuction.currentBid.toLocaleString() : currentAuction.basePrice.toLocaleString()}
                </div>

                <div className="pt-2 border-t border-white/[0.08]">
                  <span className="text-[10px] text-[#94A3B8] block">Highest Bidder:</span>
                  <div className="text-sm sm:text-base font-extrabold text-white truncate">
                    {currentAuction.currentWinningTeam ? currentAuction.currentWinningTeam.name : 'Waiting for Opening Bid...'}
                  </div>
                </div>
              </div>

              {/* COUNTDOWN TIMER BOX */}
              <div className="bg-[#0B101C] border border-white/[0.08] rounded-xl p-3 flex items-center justify-between shadow-lg shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FFC928]/10 text-[#FFC928] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white uppercase block leading-none">AUCTION COUNTDOWN</span>
                    <span className="text-[9px] text-[#94A3B8]">Timer resets on new bid</span>
                  </div>
                </div>

                <div className={`text-3xl font-black font-mono ${timerSeconds <= 10 ? 'text-rose-500 animate-pulse' : 'text-[#FFC928]'}`}>
                  ⏱ {timerSeconds}s
                </div>
              </div>
            </div>

            {/* RIGHT / LIVE BID HISTORY (COL 3) */}
            <div className="lg:col-span-3 bg-[#0B101C] border border-white/[0.08] rounded-xl p-3.5 flex flex-col min-h-0 shadow-lg">
              <h3 className="font-extrabold text-white text-xs flex items-center gap-1.5 border-b border-white/[0.08] pb-2 shrink-0">
                <History className="w-3.5 h-3.5 text-[#FFC928]" />
                <span>LIVE BID HISTORY</span>
              </h3>

              <div className="space-y-2 flex-1 min-h-0 overflow-y-auto pr-1 mt-2">
                {currentAuction.bids && currentAuction.bids.length > 0 ? (
                  currentAuction.bids.map((b: any, idx: number) => (
                    <div
                      key={b.id || idx}
                      className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                        idx === 0
                          ? 'bg-[#FFC928]/10 border-[#FFC928]/40 text-[#FFC928] font-bold'
                          : 'bg-[#080D19] border-white/[0.06] text-[#94A3B8]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <span className="block font-bold text-white truncate">{b.team.name}</span>
                        <span className="text-[9px] text-[#94A3B8]">#{b.sequenceNumber || currentAuction.bids.length - idx}</span>
                      </div>
                      <span className="font-mono text-xs font-black text-[#FFC928] shrink-0">₹{b.amount.toLocaleString()}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-[11px] text-[#94A3B8]">Waiting for first bid...</div>
                )}
              </div>
            </div>
          </div>

          {/* BOTTOM ADMIN CONTROLS BAR */}
          <div className="bg-[#0B101C] border border-white/[0.08] rounded-xl p-3 grid grid-cols-2 gap-3 shrink-0 shadow-xl">
            <button
              onClick={handleMarkSold}
              disabled={!currentAuction.currentWinningTeamId}
              className="py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                MARK SOLD (₹
                {currentAuction.currentBid > 0
                  ? currentAuction.currentBid.toLocaleString()
                  : currentAuction.basePrice.toLocaleString()}
                )
              </span>
            </button>

            <button
              onClick={handleMarkUnsold}
              className="py-3 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>MARK UNSOLD</span>
            </button>
          </div>
        </div>
      ) : (
        /* START LOT SELECTOR */
        <div className="max-w-md mx-auto my-auto bg-[#0B101C] border border-white/[0.08] rounded-2xl p-6 space-y-4 text-center shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-[#FFC928]/10 text-[#FFC928] flex items-center justify-center mx-auto border border-[#FFC928]/20">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-black text-white">Select Next Player Lot</h2>
            <p className="text-xs text-[#94A3B8]">Available verified players in pool ({availablePlayers.length})</p>
          </div>

          <div className="space-y-3">
            <select
              value={selectedPlayerId}
              onChange={(e) => setSelectedPlayerId(e.target.value)}
              className="w-full px-3.5 py-3 rounded-xl bg-[#080D19] border border-white/[0.1] text-white text-xs font-semibold focus:outline-none focus:border-[#FFC928]"
            >
              <option value="">-- Choose Player --</option>
              {availablePlayers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.playerCode || 'ASPL'} — {p.name} ({p.category}) • Base: ₹{p.basePrice?.toLocaleString() || '5,000'}
                </option>
              ))}
            </select>

            <button
              onClick={handleStartLot}
              disabled={!selectedPlayerId}
              className="w-full py-3.5 rounded-xl bg-[#FFC928] hover:bg-[#ffe066] disabled:opacity-40 text-[#05070D] font-black text-xs shadow-xl shadow-[#FFC928]/20 transition-all cursor-pointer"
            >
              Start Live Bidding Lot (30s Timer)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
