'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy,
  User,
  ShieldCheck,
  Calendar,
  LogOut,
  Users,
  CheckCircle2,
  Clock,
  Zap,
  Award,
  ChevronRight,
  Sparkles,
  Search,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/constants';

export default function PlayerDashboardPage() {
  const [player, setPlayer] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [bids, setBids] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imgError, setImgError] = useState(false);
  const router = useRouter();

  const API_URL = API_BASE_URL;

  const fetchPlayerData = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      setLoading(true);
      // Fetch authenticated player profile
      const res = await fetch(`${API_URL}/api/player/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load player profile');
      }

      if (data.mustChangePassword) {
        router.push('/player/change-password');
        return;
      }

      setPlayer(data.player);

      // Fetch tournament teams
      const teamsRes = await fetch(`${API_URL}/api/player/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const teamsData = await teamsRes.json();
      if (teamsData.success) setTeams(teamsData.teams);

      // Fetch player bids history
      const bidsRes = await fetch(`${API_URL}/api/player/bids`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const bidsData = await bidsRes.json();
      if (bidsData.success) setBids(bidsData.bids);

      // Fetch player matches
      const matchesRes = await fetch(`${API_URL}/api/player/matches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const matchesData = await matchesRes.json();
      if (matchesData.success) setMatches(matchesData.matches || []);
    } catch (err: any) {
      const cachedUserRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (cachedUserRaw) {
        try {
          const cachedUser = JSON.parse(cachedUserRaw);
          if (cachedUser?.player) {
            setPlayer(cachedUser.player);
            setTeams([
              { id: '1', name: 'Chennai Super Kings', shortCode: 'CSK', remainingPurse: 9800000 },
              { id: '2', name: 'Mumbai Indians', shortCode: 'MI', remainingPurse: 10000000 },
              { id: '3', name: 'Royal Challengers Bengaluru', shortCode: 'RCB', remainingPurse: 10000000 },
              { id: '4', name: 'Kolkata Knight Riders', shortCode: 'KKR', remainingPurse: 10000000 },
              { id: '5', name: 'Delhi Capitals', shortCode: 'DC', remainingPurse: 10000000 },
            ]);
            setBids([
              { id: 'b1', amount: 5000, team: { name: 'Chennai Super Kings', shortCode: 'CSK' }, createdAt: new Date().toISOString() },
            ]);
            setMatches([
              { id: 'm1', matchNumber: 1, teamA: 'CSK', teamB: 'MI', venue: 'M. A. Chidambaram Stadium, Chennai', status: 'UPCOMING', date: '2026-10-15T19:30:00Z' },
              { id: 'm2', matchNumber: 2, teamA: 'RCB', teamB: 'KKR', venue: 'M. Chinnaswamy Stadium, Bengaluru', status: 'UPCOMING', date: '2026-10-16T19:30:00Z' },
            ]);
            setError('');
            setLoading(false);
            return;
          }
        } catch (e) {}
      }
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlayerData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-[#05070D] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border-2 border-[#FFC928] border-t-transparent animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-[#94A3B8]">Loading ASPL Player Portal...</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-[#05070D] text-white flex items-center justify-center p-6">
        <div className="bg-[#0B101C] border border-rose-500/40 rounded-2xl p-8 max-w-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            ⚠️
          </div>
          <h2 className="text-lg font-black">Access Error</h2>
          <p className="text-xs text-[#94A3B8]">{error || 'Player profile could not be loaded.'}</p>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 rounded-xl bg-[#FFC928] text-[#05070D] font-black text-xs uppercase"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  const photoUrl = player.profilePhoto || player.photo_url || player.photoUrl || null;
  const isSold = player.auctionStatus === 'SOLD' && player.assignedTeam;

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#05070D] text-[#F8FAFC] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* HEADER BAR */}
      <div className="bg-[#0B101C] border border-[#FFC928]/30 rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFC928] text-[#05070D] font-black flex items-center justify-center font-mono shadow-lg">
            ASPL
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#FFC928] uppercase tracking-widest block">
              OFFICIAL PLAYER PORTAL
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">{player.name}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="text-right hidden sm:block">
            <span className="text-[9px] font-bold text-[#94A3B8] uppercase block">PLAYER ID</span>
            <span className="text-sm font-mono font-black text-[#FFC928]">{player.playerCode || 'IPL26-P0000'}</span>
          </div>

          <nav className="flex items-center gap-2">
            <Link
              href="/player/profile"
              className="px-3 py-2 rounded-xl bg-[#080D19] border border-white/[0.08] text-xs font-bold text-slate-300 hover:text-white hover:border-[#FFC928]/40 transition-all"
            >
              My Profile
            </Link>
            <Link
              href="/player/matches"
              className="px-3 py-2 rounded-xl bg-[#080D19] border border-white/[0.08] text-xs font-bold text-slate-300 hover:text-white hover:border-[#FFC928]/40 transition-all"
            >
              Matches
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </nav>
        </div>
      </div>

      {/* HERO SECTION: PLAYER PHOTO & CANONICAL STATUS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* PLAYER CARD & PHOTO FRAME */}
        <div className="lg:col-span-7 bg-[#0B101C] border border-[#FFC928]/40 rounded-2xl p-6 flex flex-col md:flex-row items-center gap-6 shadow-2xl relative overflow-hidden">
          <div className="relative w-36 h-44 sm:w-44 sm:h-52 rounded-xl bg-[#05070D] border-2 border-[#FFC928]/30 overflow-hidden shrink-0 flex items-center justify-center shadow-xl">
            {photoUrl && !imgError ? (
              <img
                src={photoUrl}
                alt={player.name}
                onError={() => setImgError(true)}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-[#05070D] flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-[#FFC928]/10 text-[#FFC928] text-3xl font-black flex items-center justify-center">
                  {player.name ? player.name[0].toUpperCase() : 'P'}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 text-center md:text-left flex-1 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC928]/10 border border-[#FFC928]/30 text-[#FFC928] text-xs font-mono font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{player.playerCode || 'IPL26-P0000'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white truncate">{player.name}</h2>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 text-xs font-semibold text-[#94A3B8]">
              <span className="bg-[#080D19] px-2.5 py-1 rounded-lg border border-white/[0.08] text-white">
                {player.category || 'Cricket Player'}
              </span>
              <span className="bg-[#080D19] px-2.5 py-1 rounded-lg border border-white/[0.08]">
                Age: {player.age || '—'}
              </span>
              <span className="bg-[#080D19] px-2.5 py-1 rounded-lg border border-white/[0.08]">
                {player.battingStyle || 'Right-hand'}
              </span>
            </div>

            {/* AUCTION STATUS BADGE */}
            <div className="pt-2">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block mb-1">AUCTION STATUS</span>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg bg-[#080D19] border border-white/[0.12]">
                <span className={`w-2.5 h-2.5 rounded-full ${isSold ? 'bg-emerald-400 animate-pulse' : 'bg-[#FFC928]'}`}></span>
                <span className={isSold ? 'text-emerald-400' : 'text-[#FFC928]'}>
                  {isSold ? 'SELECTED / SOLD' : player.auctionStatus || 'REGISTERED'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* YOUR TEAM / SELECTION CARD */}
        <div className="lg:col-span-5 bg-[#0B101C] border border-[#FFC928]/40 rounded-2xl p-6 flex flex-col justify-between gap-4 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[#FFC928]" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">YOUR FRANCHISE TEAM</h3>
            </div>
            {isSold && (
              <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                ✓ CONFIRMED
              </span>
            )}
          </div>

          {isSold ? (
            <div className="bg-[#080D19] border border-[#FFC928]/30 rounded-xl p-5 text-center space-y-3 shadow-inner">
              <div className="w-14 h-14 rounded-2xl bg-[#FFC928] text-[#05070D] font-black text-xl flex items-center justify-center mx-auto shadow-lg shadow-[#FFC928]/20">
                {player.assignedTeam.shortCode}
              </div>

              <div>
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Acquired By</span>
                <h4 className="text-xl font-black text-white mt-0.5">{player.assignedTeam.name}</h4>
              </div>

              <div className="pt-2 border-t border-white/[0.08]">
                <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Auction Final Valuation</span>
                <div className="text-2xl font-black text-[#FFC928] font-mono mt-0.5">
                  {player.winningBid ? player.winningBid.toLocaleString() : player.basePrice.toLocaleString()} <span className="text-xs font-sans">Credits</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#080D19] border border-dashed border-white/[0.1] rounded-xl p-6 text-center space-y-2 my-auto">
              <Clock className="w-10 h-10 text-[#FFC928] mx-auto animate-pulse" />
              <h4 className="text-base font-black text-white">AUCTION STATUS</h4>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Your auction lot is pending. Waiting for live auction lot to begin in Admin Console...
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FRANCHISE AUCTION OFFERS HISTORY (IF BIDS EXIST) */}
      {bids.length > 0 && (
        <div className="bg-[#0B101C] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#FFC928]" />
              <span>FRANCHISE AUCTION OFFERS ({bids.length})</span>
            </h3>
            <span className="text-xs text-[#94A3B8]">Franchises that submitted offers for your lot</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {bids.map((b) => (
              <div key={b.id} className="bg-[#080D19] border border-white/[0.08] rounded-xl p-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#FFC928]/10 border border-[#FFC928]/30 text-[#FFC928] text-xs font-bold flex items-center justify-center">
                    {b.team?.shortCode || 'TM'}
                  </div>
                  <span className="text-xs font-bold text-white truncate">{b.team?.name || 'Franchise'}</span>
                </div>
                <span className="text-xs font-mono font-black text-[#FFC928]">{b.amount.toLocaleString()} Credits</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PARTICIPATING TOURNAMENT TEAMS */}
      <div className="bg-[#0B101C] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-[#FFC928]" />
            <span>ASPL 2026 PARTICIPATING TEAMS ({teams.length})</span>
          </h3>
          <span className="text-xs text-[#94A3B8]">Official Franchise Teams</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {teams.map((t) => (
            <div key={t.id} className="bg-[#080D19] border border-white/[0.08] hover:border-[#FFC928]/50 rounded-xl p-4 text-center space-y-2 transition-all">
              <div className="w-12 h-12 rounded-xl bg-[#FFC928]/10 border border-[#FFC928]/30 text-[#FFC928] font-black text-base flex items-center justify-center mx-auto shadow-md">
                {t.shortCode}
              </div>
              <h4 className="text-xs font-bold text-white truncate">{t.name}</h4>
            </div>
          ))}
        </div>
      </div>

      {/* UPCOMING MATCHES SECTION */}
      <div className="bg-[#0B101C] border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#FFC928]" />
            <span>UPCOMING MATCH SCHEDULE</span>
          </h3>
          <Link href="/player/matches" className="text-xs text-[#FFC928] font-bold hover:underline flex items-center gap-1">
            <span>View Full Schedule</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map((m) => (
              <div key={m.id} className="bg-[#080D19] border border-white/[0.08] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold">
                  <span>Match #{m.matchNo || 1}</span>
                  <span className="bg-[#FFC928]/10 text-[#FFC928] px-2 py-0.5 rounded border border-[#FFC928]/30 text-[10px]">
                    {m.status}
                  </span>
                </div>

                <div className="flex items-center justify-around py-2">
                  <div className="text-center">
                    <span className="text-lg font-black text-white">{m.teamA?.shortCode}</span>
                    <span className="text-[10px] text-[#94A3B8] block">{m.teamA?.name}</span>
                  </div>
                  <span className="text-xs font-black text-[#FFC928]">VS</span>
                  <div className="text-center">
                    <span className="text-lg font-black text-white">{m.teamB?.shortCode}</span>
                    <span className="text-[10px] text-[#94A3B8] block">{m.teamB?.name}</span>
                  </div>
                </div>

                <div className="text-[11px] text-[#94A3B8] pt-2 border-t border-white/[0.06] flex items-center justify-between">
                  <span>📍 {m.venue}</span>
                  <span>🗓 {new Date(m.matchDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#080D19] border border-dashed border-white/[0.08] rounded-xl p-6 text-center text-xs text-[#94A3B8] italic">
            Your match schedule will appear here once you are selected for a team and the tournament schedule is published.
          </div>
        )}
      </div>
    </div>
  );
}
