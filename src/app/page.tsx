'use client';

import Link from 'next/link';
import {
  Trophy,
  ArrowRight,
  Monitor,
  CheckCircle2,
  Users,
  Coins,
  ShieldCheck,
  Zap,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import CricketVideoBackground from '@/components/CricketVideoBackground';

export default function HomePage() {
  const [auction, setAuction] = useState<any>(null);
  const [summary, setSummary] = useState<any>({
    stats: { totalPlayers: 100, totalTeams: 8, maxSquadSize: 15, fee: 208 },
    teams: [
      { id: '1', name: 'Chennai Strikers', shortCode: 'CS' },
      { id: '2', name: 'Mumbai Titans', shortCode: 'MT' },
      { id: '3', name: 'Bangalore Royals', shortCode: 'BR' },
      { id: '4', name: 'Delhi Superkings', shortCode: 'DSK' },
      { id: '5', name: 'Kolkata Warriors', shortCode: 'KW' },
      { id: '6', name: 'Hyderabad Falcons', shortCode: 'HF' },
      { id: '7', name: 'Punjab Lions', shortCode: 'PL' },
      { id: '8', name: 'Rajasthan Champions', shortCode: 'RC' },
    ],
  });

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    // Fetch current active auction lot
    fetch(`${apiUrl}/api/auction/current`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.auction) {
          setAuction(data.auction);
        }
      })
      .catch(() => {});

    // Fetch tournament public summary statistics & teams
    fetch(`${apiUrl}/api/auction/public-summary`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.stats) {
          setSummary(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="w-full bg-[#05070D] text-[#F8FAFC]">
      {/* ==================================================
          1. HERO SECTION (Floating Content Directly Over Stadium Video)
         ================================================== */}
      <section className="relative min-h-[90vh] md:min-h-screen flex flex-col justify-center items-center text-center overflow-hidden px-6 md:px-8">
        {/* Scoped Hero Cinematic Stadium Night Video & Overlay Layers */}
        <CricketVideoBackground />

        {/* Floating Content Container (No dark card/box, max-width 900px, translateY -30px) */}
        <div
          className="relative z-10 max-w-[900px] mx-auto py-16 space-y-8 bg-transparent border-0 shadow-none backdrop-filter-none"
          style={{ transform: 'translateY(-30px)' }}
        >
          {/* Small Eyebrow Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase"
            style={{
              background: 'rgba(8, 12, 20, 0.78)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <span style={{ color: '#FFC928' }}>ASPL 2026</span>
            <span style={{ color: '#64748B' }}>•</span>
            <span style={{ color: '#D1D5DB' }}>ALL-STAR PREMIER LEAGUE</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[1.05]">
            <span style={{ color: '#FFFFFF', textShadow: '0 3px 14px rgba(0, 0, 0, 0.55)' }}>
              WHERE LEGENDS
            </span>
            <br />
            <span style={{ color: '#FFC928', textShadow: '0 3px 14px rgba(0, 0, 0, 0.55)' }}>
              MEET THE GAME
            </span>
          </h1>

          {/* Supporting Text */}
          <p
            className="text-base sm:text-xl max-w-xl mx-auto leading-relaxed"
            style={{
              color: '#E5E7EB',
              fontWeight: 500,
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.7)',
            }}
          >
            Register. Get verified. Enter the live auction.
          </p>

          {/* CTA Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="btn-gold w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-2xl"
            >
              <span>REGISTER AS PLAYER</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/spectator"
              className="btn-secondary-dark w-full sm:w-auto px-8 py-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 backdrop-blur-md"
            >
              <span>VIEW LIVE AUCTION</span>
            </Link>
          </div>

          {/* Registration Price Badge */}
          <div>
            <div
              className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-mono font-medium tracking-wide"
              style={{
                background: 'rgba(8, 12, 20, 0.78)',
                border: '1px solid rgba(255, 201, 40, 0.30)',
                color: '#D9DEE8',
              }}
            >
              <span style={{ color: '#FFC928' }}>₹{summary.stats.fee}</span>
              <span>• ONE-TIME REGISTRATION</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          2. HOW IT WORKS (Editorial 3-Step Section)
         ================================================== */}
      <section className="w-full py-24 md:py-32 bg-[#05070D]">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 space-y-16">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#8C97AA] uppercase tracking-widest block">
              HOW IT WORKS
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              From registration to the auction stage.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/[0.08] pt-12">
            {/* Step 01 */}
            <div className="space-y-4">
              <div className="text-xl font-black text-[#F5B800] font-mono tracking-wider">
                01
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                REGISTER
              </h3>
              <p className="text-sm text-[#8C97AA] leading-relaxed">
                Create your official ASPL player profile and complete the registration payment.
              </p>
            </div>

            {/* Step 02 */}
            <div className="space-y-4">
              <div className="text-xl font-black text-[#F5B800] font-mono tracking-wider">
                02
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                GET VERIFIED
              </h3>
              <p className="text-sm text-[#8C97AA] leading-relaxed">
                Receive your Player ID and registration confirmation via WhatsApp.
              </p>
            </div>

            {/* Step 03 */}
            <div className="space-y-4">
              <div className="text-xl font-black text-[#F5B800] font-mono tracking-wider">
                03
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">
                ENTER THE AUCTION
              </h3>
              <p className="text-sm text-[#8C97AA] leading-relaxed">
                Your verified player profile enters the live auction stage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          4. THE TOURNAMENT (Editorial 2-Column Overview)
         ================================================== */}
      <section id="tournament" className="w-full py-24 md:py-32 bg-[#0B101C] border-y border-white/[0.08]">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 space-y-12">
          <span className="text-xs font-bold text-[#F5B800] uppercase tracking-widest block">
            THE TOURNAMENT
          </span>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Left Side: Editorial Description */}
            <div className="space-y-6">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                The Premier Platform for All-Star Cricket Talent
              </h2>
              <p className="text-base text-[#8C97AA] leading-relaxed">
                All-Star Premier League (ASPL 2026) combines professional tournament management with a realtime digital bidding engine. Players get verified through official gateways, receive digital WhatsApp credentials, and get drafted into franchise squads on live broadcast displays.
              </p>
            </div>

            {/* Right Side: Key Metadata Grid */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-6 rounded-xl bg-[#05070D] border border-white/[0.08] space-y-2">
                <span className="text-[11px] font-bold text-[#8C97AA] uppercase tracking-widest block">
                  REGISTRATION
                </span>
                <div className="text-2xl font-black text-white font-mono">
                  ₹{summary.stats.fee}
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#05070D] border border-white/[0.08] space-y-2">
                <span className="text-[11px] font-bold text-[#8C97AA] uppercase tracking-widest block">
                  SQUAD SIZE
                </span>
                <div className="text-2xl font-black text-white font-mono">
                  15 PLAYERS
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#05070D] border border-white/[0.08] space-y-2">
                <span className="text-[11px] font-bold text-[#8C97AA] uppercase tracking-widest block">
                  AUCTION
                </span>
                <div className="text-lg font-extrabold text-[#F5B800]">
                  REAL-TIME BIDDING
                </div>
              </div>

              <div className="p-6 rounded-xl bg-[#05070D] border border-white/[0.08] space-y-2">
                <span className="text-[11px] font-bold text-[#8C97AA] uppercase tracking-widest block">
                  PLAYER ID
                </span>
                <div className="text-lg font-extrabold text-[#22C55E]">
                  WHATSAPP VERIFIED
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          5. LIVE AUCTION FEATURE (Broadcast Preview UI)
         ================================================== */}
      <section className="w-full py-24 md:py-32 bg-[#05070D]">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                LIVE BROADCAST FEATURE
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
                Realtime Bidding Engine
              </h2>
            </div>

            <Link
              href="/spectator"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#F5B800] hover:text-[#FFD84D] transition-colors"
            >
              <span>VIEW LIVE AUCTION</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Premium Sports Auction Broadcast Preview Card */}
          <div className="w-full rounded-2xl bg-[#0B101C] border border-white/[0.08] p-6 md:p-10 space-y-8 shadow-2xl">
            {/* Header Strip */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-6">
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-xs font-extrabold text-white uppercase tracking-widest">
                  LIVE AUCTION
                </span>
                <span className="text-xs text-[#8C97AA] font-mono">
                  • LOT #{auction ? auction.player.playerCode : 'ASPL024'}
                </span>
              </div>

              <div className="px-3 py-1 rounded bg-white/[0.05] border border-white/[0.08] text-xs font-mono text-[#8C97AA]">
                STATUS: {auction ? auction.state : 'ACTIVE'}
              </div>
            </div>

            {/* Broadcast Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Left Column: Player Info */}
              <div className="lg:col-span-2 space-y-4">
                <span className="text-xs font-bold text-[#8C97AA] uppercase tracking-wider block">
                  {auction ? auction.player.category : 'BATSMAN / ALL-ROUNDER'}
                </span>
                <h3 className="text-4xl md:text-6xl font-black text-white tracking-tight">
                  {auction ? auction.player.name : 'Rahul Sharma'}
                </h3>
                <div className="flex items-center gap-6 pt-2 text-xs text-[#8C97AA]">
                  <span>Right-hand Bat</span>
                  <span>•</span>
                  <span>Right-arm Fast</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">Verified Player Pass</span>
                </div>
              </div>

              {/* Right Column: Current Highest Bid */}
              <div className="p-6 rounded-xl bg-[#05070D] border border-amber-500/30 space-y-2 text-center lg:text-right">
                <span className="text-[11px] font-bold text-[#8C97AA] uppercase tracking-widest block">
                  CURRENT LEADING BID
                </span>
                <div className="text-4xl md:text-5xl font-black text-[#F5B800] font-mono tracking-tight">
                  ₹{auction ? auction.currentBid.toLocaleString() : '14,500'}
                </div>
                <div className="text-xs text-white font-bold pt-1">
                  {auction && auction.currentWinningTeam ? auction.currentWinningTeam.name : 'Mumbai Titans'}
                </div>
              </div>
            </div>

            {/* Recent Bidding Stream Table */}
            <div className="border-t border-white/[0.08] pt-6 space-y-3">
              <span className="text-[11px] font-bold text-[#8C97AA] uppercase tracking-widest block">
                RECENT BID LOG STREAM
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                <div className="p-3 rounded-lg bg-[#05070D] border border-white/[0.05] flex justify-between items-center">
                  <span className="text-[#8C97AA]">Chennai Strikers</span>
                  <span className="text-white font-bold">₹14,000</span>
                </div>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex justify-between items-center text-[#F5B800]">
                  <span className="font-bold">Mumbai Titans (LEADING)</span>
                  <span className="font-bold">₹14,500</span>
                </div>

                <div className="p-3 rounded-lg bg-[#05070D] border border-white/[0.05] flex justify-between items-center">
                  <span className="text-[#8C97AA]">Delhi Superkings</span>
                  <span className="text-white font-bold">₹13,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          6. THE TEAMS
         ================================================== */}
      <section id="teams" className="w-full py-24 md:py-32 bg-[#0B101C] border-y border-white/[0.08]">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 space-y-12">
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#F5B800] uppercase tracking-widest block">
              THE TEAMS
            </span>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
              Official Franchise Squads
            </h2>
          </div>

          {/* Teams Horizontal/Grid Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {summary.teams.map((team: any) => (
              <div
                key={team.id || team.shortCode}
                className="surface-card p-6 flex flex-col items-center text-center space-y-4 hover:border-[#F5B800]/40 transition-colors"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#05070D] border border-white/[0.08] text-[#F5B800] font-black text-lg flex items-center justify-center shadow-lg font-mono">
                  {team.shortCode || team.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm tracking-tight">
                    {team.name}
                  </h4>
                  <span className="text-[11px] text-[#8C97AA] font-mono block mt-1">
                    Max 15 Squad
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================
          7. FINAL PLAYER CTA (Solid Dark Background)
         ================================================== */}
      <section className="relative py-28 md:py-36 bg-[#05070D] border-t border-white/[0.08] text-center overflow-hidden px-6 md:px-8">
        <div className="relative z-10 max-w-[680px] mx-auto space-y-6">
          <h2 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-tight">
            READY TO ENTER THE GAME?
          </h2>

          <p className="text-base sm:text-lg text-[#8C97AA] font-normal leading-relaxed">
            Your journey to the ASPL auction starts here.
          </p>

          <div className="pt-4">
            <Link
              href="/register"
              className="btn-gold inline-flex items-center gap-2 px-10 py-4.5 rounded-xl text-sm font-extrabold shadow-2xl"
            >
              <span>REGISTER AS PLAYER</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
