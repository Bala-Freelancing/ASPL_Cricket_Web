'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, ShieldCheck, ArrowLeft, Trophy, CheckCircle2, Lock } from 'lucide-react';

export default function PlayerProfilePage() {
  const [player, setPlayer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://aspl-cricket-web.onrender.com';

  useEffect(() => {
    const fetchProfile = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/player/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load profile');
        }
        setPlayer(data.player);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-[#05070D] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#FFC928] border-t-transparent animate-spin mx-auto"></div>
          <p className="text-xs text-[#94A3B8]">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-[#05070D] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-xs text-rose-400">{error || 'Profile not found'}</p>
          <Link href="/login" className="text-xs text-[#FFC928] underline">Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-[#05070D] text-[#F8FAFC] p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/player/dashboard" className="text-xs text-[#94A3B8] hover:text-white flex items-center gap-1.5 bg-[#0B101C] border border-white/[0.08] px-3.5 py-2 rounded-xl">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
        <div className="text-xs font-mono font-black text-[#FFC928] bg-[#FFC928]/10 border border-[#FFC928]/30 px-3 py-1.5 rounded-xl">
          {player.playerCode}
        </div>
      </div>

      <div className="bg-[#0B101C] border border-[#FFC928]/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center gap-6 border-b border-white/[0.08] pb-6">
          <div className="w-28 h-36 rounded-xl bg-[#05070D] border-2 border-[#FFC928]/30 overflow-hidden shrink-0 flex items-center justify-center">
            {player.profilePhoto ? (
              <img src={player.profilePhoto} alt={player.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <div className="w-full h-full text-[#FFC928] font-black text-2xl flex items-center justify-center">
                {player.name ? player.name[0] : 'P'}
              </div>
            )}
          </div>

          <div className="space-y-2 text-center sm:text-left">
            <span className="text-[10px] font-bold text-[#FFC928] uppercase tracking-widest block">VERIFIED PLAYER PROFILE</span>
            <h1 className="text-2xl font-black text-white">{player.name}</h1>
            <p className="text-xs text-[#94A3B8]">{player.email} • {player.phone}</p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Registration & Fee Verified</span>
            </div>
          </div>
        </div>

        {/* VERIFIED CRICKET ATTRIBUTES GRID */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-wider">VERIFIED ATHLETE SPECIFICATIONS</h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#080D19] border border-white/[0.08] rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Primary Category</span>
              <strong className="text-white font-bold text-sm block">{player.category}</strong>
            </div>

            <div className="bg-[#080D19] border border-white/[0.08] rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Batting Style</span>
              <strong className="text-white font-bold text-sm block">{player.battingStyle || 'Right-hand'}</strong>
            </div>

            <div className="bg-[#080D19] border border-white/[0.08] rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Bowling Style</span>
              <strong className="text-white font-bold text-sm block">{player.bowlingStyle || 'None'}</strong>
            </div>

            <div className="bg-[#080D19] border border-white/[0.08] rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Wicketkeeper Status</span>
              <strong className="text-white font-bold text-sm block">{player.isWicketkeeper ? 'Yes' : 'No'}</strong>
            </div>

            <div className="bg-[#080D19] border border-white/[0.08] rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">Age / DOB</span>
              <strong className="text-white font-bold text-sm block">{player.age} Years {player.dob ? `(${player.dob})` : ''}</strong>
            </div>

            <div className="bg-[#080D19] border border-white/[0.08] rounded-xl p-3.5 space-y-1">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase block">T-Shirt Size</span>
              <strong className="text-white font-bold text-sm block">{player.tshirtSize || 'L'}</strong>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#080D19] border border-white/[0.06] text-xs text-[#94A3B8] flex items-center justify-between">
          <span>Need to modify sensitive verified identity information?</span>
          <span className="text-xs text-[#FFC928] font-bold">Contact Tournament Admin</span>
        </div>
      </div>
    </div>
  );
}
