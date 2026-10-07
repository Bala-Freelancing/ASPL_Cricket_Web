'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Trophy, Clock, Sparkles, Activity } from 'lucide-react';

export default function SpectatorPage() {
  const [currentAuction, setCurrentAuction] = useState<any>(null);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [imgError, setImgError] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://aspl-cricket-web.onrender.com';

  useEffect(() => {
    fetch(`${API_URL}/api/auction/current`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.auction) setCurrentAuction(data.auction);
      })
      .catch(() => {});

    const socket = io(API_URL);
    socket.emit('auction:join');

    socket.on('auction:state_sync', (data: any) => {
      if (data && data.auction) setCurrentAuction(data.auction);
    });

    socket.on('auction:started', (auction: any) => {
      setCurrentAuction(auction);
      setTimerSeconds(30);
      setImgError(false);
    });

    socket.on('auction:bid_placed', (data: any) => {
      setCurrentAuction(data.auction);
      setTimerSeconds(60);
    });

    socket.on('auction:timer_tick', (data: any) => {
      setTimerSeconds(data.remainingSeconds);
    });

    socket.on('auction:sold', () => {
      setCurrentAuction(null);
    });

    socket.on('auction:unsold', () => {
      setCurrentAuction(null);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    setImgError(false);
  }, [currentAuction?.player?.id]);

  const player = currentAuction?.player;
  const photoUrl = player?.profilePhoto || player?.photo_url || player?.photoUrl || null;

  return (
    <div className="h-screen overflow-hidden bg-[#05070D] text-[#F8FAFC] p-3 sm:p-5 flex flex-col justify-between relative selection:bg-[#FFC928]">
      {/* BACKGROUND BROADCAST GLOW ORBS */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#FFC928]/5 rounded-full blur-[180px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[180px] pointer-events-none"></div>

      {/* COMPACT BROADCAST HEADER */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FFC928] text-[#05070D] font-black flex items-center justify-center shadow-lg shadow-[#FFC928]/10">
            <Trophy className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block leading-none">ASPL 2026</span>
            <span className="text-[9px] text-[#94A3B8] font-bold tracking-wider uppercase mt-0.5 block">
              STAGE AUCTION BROADCAST
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px] font-black uppercase tracking-widest">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
          <span>🔴 STAGE BROADCAST LIVE</span>
        </div>
      </div>

      {/* MAIN BROADCAST ARENA - FIT TO VIEWPORT */}
      {currentAuction && player ? (
        <div className="relative z-10 flex-1 min-h-0 py-2 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* LEFT COLUMN: PLAYER PHOTO & IDENTITY (COL 5) */}
          <div className="lg:col-span-5 bg-[#0B101C] border border-[#FFC928]/20 rounded-2xl p-4 flex flex-col justify-between gap-3 min-h-0 shadow-2xl">
            {/* PORTRAIT PLAYER PHOTO — Expands to fill card height */}
            <div className="relative w-full flex-1 min-h-[240px] rounded-xl bg-[#080D19] border border-[#FFC928]/25 overflow-hidden flex items-center justify-center">
              {photoUrl && !imgError ? (
                <img
                  src={photoUrl}
                  alt={player.name}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="w-full h-full bg-[#080D19] flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-[#FFC928]/10 border border-[#FFC928]/30 text-[#FFC928] text-4xl font-black flex items-center justify-center">
                    {player.name ? player.name[0].toUpperCase() : 'P'}
                  </div>
                </div>
              )}
            </div>

            {/* BELOW PHOTO DETAILS */}
            <div className="space-y-2 shrink-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFC928]/10 border border-[#FFC928]/25 text-[#FFC928] text-xs font-bold font-mono tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>LOT #{player.playerCode || 'IPL26-P0000'}</span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight truncate">
                {player.name}
              </h2>

              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-[#080D19] border border-white/[0.06]">
                  <span className="block text-[9px] text-[#94A3B8] uppercase">Role</span>
                  <strong className="text-white font-bold text-xs block mt-0.5 truncate">{player.category}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[#080D19] border border-white/[0.06]">
                  <span className="block text-[9px] text-[#94A3B8] uppercase">Batting</span>
                  <strong className="text-white font-bold text-xs block mt-0.5 truncate">{player.battingStyle}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-[#080D19] border border-white/[0.06]">
                  <span className="block text-[9px] text-[#94A3B8] uppercase">Bowling</span>
                  <strong className="text-white font-bold text-xs block mt-0.5 truncate">{player.bowlingStyle}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CURRENT HIGHEST BID & COUNTDOWN (COL 7) */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-4 text-center lg:text-left min-h-0">
            {/* HIGHEST BID DISPLAY */}
            <div className="bg-[#0B101C] border border-[#FFC928]/35 rounded-2xl p-6 sm:p-8 flex-1 flex flex-col justify-center gap-2 shadow-2xl relative overflow-hidden">
              <span className="text-xs font-bold text-[#FFC928] uppercase tracking-widest block">
                CURRENT HIGHEST BID
              </span>

              <div className="text-5xl sm:text-6xl lg:text-7xl font-black text-[#FFC928] font-mono tracking-tight my-1">
                ₹
                {currentAuction.currentBid > 0
                  ? currentAuction.currentBid.toLocaleString()
                  : currentAuction.basePrice.toLocaleString()}
              </div>

              <div className="pt-3 border-t border-white/[0.08]">
                <span className="text-xs text-[#94A3B8] block mb-1">HIGHEST BIDDER</span>
                <div className="text-xl sm:text-2xl font-black text-white truncate">
                  {currentAuction.currentWinningTeam
                    ? currentAuction.currentWinningTeam.name
                    : 'Waiting for Opening Bid...'}
                </div>
              </div>
            </div>

            {/* AUCTION COUNTDOWN & STREAM TICKER */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 shrink-0">
              <div className="bg-[#0B101C] border border-white/[0.08] rounded-xl p-4 flex items-center justify-between shadow-xl">
                <div>
                  <span className="text-xs font-bold text-white uppercase block leading-none">AUCTION COUNTDOWN</span>
                  <span className="text-[9px] text-[#94A3B8]">Synced with server timer</span>
                </div>

                <div
                  className={`text-3xl font-black font-mono tracking-tight ${
                    timerSeconds <= 10 ? 'text-rose-500 animate-pulse' : 'text-[#FFC928]'
                  }`}
                >
                  ⏱ {timerSeconds}s
                </div>
              </div>

              <div className="bg-[#0B101C] border border-white/[0.08] rounded-xl p-4 flex items-center justify-between shadow-xl">
                <div>
                  <span className="text-xs font-bold text-[#FFC928] uppercase block leading-none">BID HISTORY TICKER</span>
                  <span className="text-[9px] text-[#94A3B8]">
                    {currentAuction.bids?.length || 0} Total Bids Submitted
                  </span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-[#FFC928]/10 text-[#FFC928] flex items-center justify-center font-black">
                  <Activity className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STAGE ARENA IDLE SCREEN */
        <div className="relative z-10 my-auto text-center space-y-4 bg-[#0B101C] border border-white/[0.08] rounded-2xl max-w-2xl mx-auto w-full p-8 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-[#FFC928]/10 text-[#FFC928] flex items-center justify-center mx-auto border border-[#FFC928]/20 animate-pulse">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-black text-white">ASPL STAGE ARENA</h2>
            <p className="text-[#94A3B8] text-xs max-w-md mx-auto">
              Preparing next player lot for bidding. Live stream will automatically update when auction begins.
            </p>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="relative z-10 border-t border-white/[0.08] pt-2.5 flex items-center justify-between text-[11px] text-[#94A3B8] shrink-0">
        <span>ASPL Cricket Tournament Official Stage Feed</span>
        <span className="flex items-center gap-2 text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Realtime Socket Connected
        </span>
      </div>
    </div>
  );
}
