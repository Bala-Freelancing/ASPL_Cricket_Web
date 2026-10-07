'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, ArrowLeft, Trophy, Clock } from 'lucide-react';

export default function PlayerMatchesPage() {
  const [matches, setMatches] = useState<any[]>([]);
  const [assignedTeamId, setAssignedTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://aspl-cricket-web.onrender.com';

  useEffect(() => {
    const fetchMatches = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/player/matches`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load matches');
        }
        setMatches(data.matches || []);
        setAssignedTeamId(data.assignedTeamId || null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-6rem)] bg-[#05070D] text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-[#FFC928] border-t-transparent animate-spin mx-auto"></div>
          <p className="text-xs text-[#94A3B8]">Loading Match Schedule...</p>
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
        <div className="text-xs font-mono font-black text-[#FFC928]">
          TOURNAMENT MATCHES
        </div>
      </div>

      <div className="bg-[#0B101C] border border-[#FFC928]/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FFC928]/10 text-[#FFC928] border border-[#FFC928]/30 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Match Schedule</h1>
              <p className="text-xs text-[#94A3B8]">Official tournament fixtures for your assigned squad</p>
            </div>
          </div>
        </div>

        {matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((m) => (
              <div key={m.id} className="bg-[#080D19] border border-white/[0.08] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between text-xs font-bold text-[#94A3B8]">
                  <span>ASPL 2026 — Match #{m.matchNo || 1}</span>
                  <span className="bg-[#FFC928]/10 text-[#FFC928] px-2.5 py-1 rounded-full border border-[#FFC928]/30 text-[10px] uppercase font-black">
                    {m.status}
                  </span>
                </div>

                <div className="flex items-center justify-around py-3 bg-[#05070D] rounded-xl border border-white/[0.06]">
                  <div className="text-center">
                    <span className="text-xl font-black text-white">{m.teamA?.shortCode}</span>
                    <span className="text-xs text-[#94A3B8] block">{m.teamA?.name}</span>
                  </div>
                  <span className="text-sm font-black text-[#FFC928]">VS</span>
                  <div className="text-center">
                    <span className="text-lg font-black text-white">{m.teamB?.shortCode}</span>
                    <span className="text-xs text-[#94A3B8] block">{m.teamB?.name}</span>
                  </div>
                </div>

                <div className="text-xs text-[#94A3B8] flex items-center justify-between pt-1">
                  <span>📍 {m.venue || 'ASPL Stadium'}</span>
                  <span>🗓 {new Date(m.matchDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#080D19] border border-dashed border-white/[0.08] rounded-xl p-8 text-center space-y-2">
            <Clock className="w-10 h-10 text-[#FFC928] mx-auto animate-pulse" />
            <h3 className="text-base font-black text-white">SCHEDULE PENDING</h3>
            <p className="text-xs text-[#94A3B8] max-w-md mx-auto leading-relaxed">
              Your match schedule will appear here once you are selected for a team during the live auction and the tournament schedule is published by administrators.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
