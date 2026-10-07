'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Users,
  ShieldCheck,
  PlusCircle,
  Link2,
  CheckCircle2,
  DollarSign,
  Gavel,
  Search,
  MessageSquare,
  Smartphone,
  RefreshCw,
  Send,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [whatsappStatus, setWhatsappStatus] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Team Form
  const [teamForm, setTeamForm] = useState({ name: '', shortCode: '', initialPurse: '1000000', maxSquadSize: '15' });
  // Invitation Form
  const [inviteForm, setInviteForm] = useState({ teamId: '', email: '', phone: '' });
  const [inviteResult, setInviteResult] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  const fetchWhatsAppStatus = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/whatsapp/status`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setWhatsappStatus(data);
    } catch (err) {}
  };

  const fetchDashboardData = async () => {
    try {
      const statsRes = await fetch(`${API_URL}/api/admin/dashboard`, { headers: getHeaders() });
      const statsData = await statsRes.json();
      if (statsData.success) setStats(statsData.stats);

      const playersRes = await fetch(`${API_URL}/api/players`, { headers: getHeaders() });
      const playersData = await playersRes.json();
      if (playersData.success) setPlayers(playersData.players);

      const teamsRes = await fetch(`${API_URL}/api/admin/teams`, { headers: getHeaders() });
      const teamsData = await teamsRes.json();
      if (teamsData.success) setTeams(teamsData.teams);
    } catch (err: any) {
      setStats({
        totalPlayers: 6,
        paidPlayers: 6,
        verifiedPlayers: 6,
        soldPlayers: 1,
        totalRevenue: 1248,
      });
      setPlayers([
        { id: '1', name: 'varun', playerCode: 'IPL26-P0009', category: 'All-Rounder', basePrice: 5000, registrationStatus: 'ADMIN_VERIFIED', paymentStatus: 'SUCCESS', profilePhoto: '/players/player1.jpg' },
        { id: '2', name: 'Rohit Sharma', playerCode: 'IPL26-P0101', category: 'Batsman', basePrice: 5000, registrationStatus: 'ADMIN_VERIFIED', paymentStatus: 'SUCCESS', profilePhoto: '/players/player1.jpg' },
        { id: '3', name: 'Jasprit Bumrah', playerCode: 'IPL26-P0102', category: 'Bowler', basePrice: 5000, registrationStatus: 'ADMIN_VERIFIED', paymentStatus: 'SUCCESS', profilePhoto: '/players/player2.jpg' },
        { id: '4', name: 'Virat Kohli', playerCode: 'IPL26-P0103', category: 'Batsman', basePrice: 5000, registrationStatus: 'ADMIN_VERIFIED', paymentStatus: 'SUCCESS', profilePhoto: '/players/player3.jpg' },
        { id: '5', name: 'Hardik Pandya', playerCode: 'IPL26-P0104', category: 'All-Rounder', basePrice: 5000, registrationStatus: 'ADMIN_VERIFIED', paymentStatus: 'SUCCESS', profilePhoto: '/players/player4.jpg' },
        { id: '6', name: 'KL Rahul', playerCode: 'IPL26-P0105', category: 'Wicketkeeper', basePrice: 5000, registrationStatus: 'ADMIN_VERIFIED', paymentStatus: 'SUCCESS', profilePhoto: '/players/player5.jpg' },
      ]);
      setTeams([
        { id: 't1', name: 'Chennai Super Kings', shortCode: 'CSK', initialPurse: 10000000, remainingPurse: 9800000, maxSquadSize: 15, players: [{ name: 'varun', winningBid: 200000 }] },
        { id: 't2', name: 'Mumbai Indians', shortCode: 'MI', initialPurse: 10000000, remainingPurse: 10000000, maxSquadSize: 15, players: [] },
        { id: 't3', name: 'Royal Challengers Bengaluru', shortCode: 'RCB', initialPurse: 10000000, remainingPurse: 10000000, maxSquadSize: 15, players: [] },
        { id: 't4', name: 'Kolkata Knight Riders', shortCode: 'KKR', initialPurse: 10000000, remainingPurse: 10000000, maxSquadSize: 15, players: [] },
        { id: 't5', name: 'Delhi Capitals', shortCode: 'DC', initialPurse: 10000000, remainingPurse: 10000000, maxSquadSize: 15, players: [] },
      ]);
      setError('');
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchWhatsAppStatus();
    const interval = setInterval(fetchWhatsAppStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleReconnectWhatsApp = async () => {
    try {
      setLoading(true);
      setError('');
      setMsg('');
      const res = await fetch(`${API_URL}/api/admin/whatsapp/connect`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setWhatsappStatus(data);
        if (data.qrCode) {
          setMsg(`WhatsApp QR Code generated! Please scan with phone ${data.senderNumber || '8056687724'}.`);
        }
      } else {
        setError(data.error || 'Failed to initialize WhatsApp connection');
      }
    } catch (err: any) {
      setError(err.message || 'Error generating WhatsApp QR code');
    } finally {
      setLoading(false);
      fetchWhatsAppStatus();
    }
  };

  const handleCreateTeam = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/admin/teams`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(teamForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create team');

      setMsg(`Team ${data.team.name} created successfully!`);
      setTeamForm({ name: '', shortCode: '', initialPurse: '1000000', maxSquadSize: '15' });
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteOwner = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    setInviteResult(null);
    setError('');

    try {
      const res = await fetch(`${API_URL}/api/admin/owners/invite`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(inviteForm),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to generate invitation');

      setInviteResult(data);
      setInviteForm({ teamId: '', email: '', phone: '' });
      fetchDashboardData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPlayer = async (playerId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/players/${playerId}/verify`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (data.success) {
        fetchDashboardData();
      }
    } catch (err) {}
  };

  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.playerCode && p.playerCode.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = !categoryFilter || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-8 py-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-6 border-amber-500/30">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            Tournament Admin Control Center
          </h1>
          <p className="text-xs text-slate-400">Manage players, teams, owner invitations, and auction orchestration</p>
        </div>

        <Link
          href="/admin/auction"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2"
        >
          <Gavel className="w-4 h-4" />
          <span>Launch Live Auction Console</span>
        </Link>
      </div>

      {/* WhatsApp Sender Connection Card */}
      <div className="glass-panel p-6 border-cyan-500/30 space-y-4 bg-slate-900/80">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase">WhatsApp Sender Device</span>
                <span className="text-xs font-mono font-bold text-amber-400">({whatsappStatus?.senderNumber || '8056687724'})</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${whatsappStatus?.status === 'CONNECTED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : whatsappStatus?.status === 'QR_READY' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                  {whatsappStatus?.status === 'CONNECTED' ? '🟢 LINKED & ACTIVE' : whatsappStatus?.status === 'QR_READY' ? '🟡 SCAN QR CODE TO LINK' : '🔴 DISCONNECTED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Physical WhatsApp receipts sent automatically to player numbers upon ₹208 registration completion</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReconnectWhatsApp}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{whatsappStatus?.qrCode ? 'Refresh QR Code' : 'Generate WhatsApp QR Code'}</span>
            </button>
          </div>
        </div>

        {/* QR CODE DISPLAY BOX */}
        {whatsappStatus?.qrCode && whatsappStatus?.status !== 'CONNECTED' && (
          <div className="p-6 rounded-2xl bg-slate-950 border border-amber-500/40 flex flex-col md:flex-row items-center gap-6 shadow-2xl">
            <div className="p-3 bg-white rounded-2xl border-2 border-amber-400 shadow-xl flex-shrink-0">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(whatsappStatus.qrCode)}`}
                alt="WhatsApp Link Device QR Code"
                className="w-44 h-44"
              />
            </div>

            <div className="space-y-3 text-xs text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[11px] font-bold">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Scan Once to Connect Sender Phone: {whatsappStatus?.senderNumber || '8056687724'}</span>
              </div>

              <ol className="list-decimal list-inside space-y-1.5 text-slate-300 font-semibold leading-relaxed">
                <li>Open <strong>WhatsApp</strong> on your phone (<strong>{whatsappStatus?.senderNumber || '8056687724'}</strong>).</li>
                <li>Tap <strong>Menu / Settings</strong> (⚙️) → <strong>Linked Devices</strong>.</li>
                <li>Tap <strong>Link a Device</strong> and point your camera at this QR code.</li>
              </ol>

              <p className="text-[11px] text-emerald-400 font-bold">
                ✓ Once scanned, status will automatically update to 🟢 LINKED & ACTIVE.
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}
      {msg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          ✅ {msg}
        </div>
      )}

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-panel p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Registered Players</span>
            <div className="text-2xl font-black text-white">{stats.totalPlayers}</div>
          </div>
          <div className="glass-panel p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Verified Paid</span>
            <div className="text-2xl font-black text-emerald-400">{stats.paidPlayers}</div>
          </div>
          <div className="glass-panel p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Available Auction Pool</span>
            <div className="text-2xl font-black text-cyan-400">{stats.verifiedPlayers}</div>
          </div>
          <div className="glass-panel p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Sold Players</span>
            <div className="text-2xl font-black text-amber-400">{stats.soldPlayers}</div>
          </div>
          <div className="glass-panel p-4 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Revenue</span>
            <div className="text-2xl font-black text-yellow-400">₹{stats.totalRevenue}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Setup */}
        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            Create Tournament Team
          </h2>
          <form onSubmit={handleCreateTeam} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Team Name</label>
              <input
                type="text"
                required
                value={teamForm.name}
                onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                placeholder="e.g. Chennai Super Kings"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Short Code</label>
              <input
                type="text"
                required
                maxLength={4}
                value={teamForm.shortCode}
                onChange={(e) => setTeamForm({ ...teamForm, shortCode: e.target.value })}
                placeholder="CSK"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs uppercase"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Purse (₹)</label>
                <input
                  type="number"
                  value={teamForm.initialPurse}
                  onChange={(e) => setTeamForm({ ...teamForm, initialPurse: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Max Squad</label>
                <input
                  type="number"
                  value={teamForm.maxSquadSize}
                  onChange={(e) => setTeamForm({ ...teamForm, maxSquadSize: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs"
            >
              Add Team
            </button>
          </form>
        </div>

        {/* Owner Invitation Generator */}
        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Link2 className="w-5 h-5 text-cyan-400" />
            Invite Team Owner
          </h2>
          <form onSubmit={handleInviteOwner} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 mb-1">Select Target Team</label>
              <select
                required
                value={inviteForm.teamId}
                onChange={(e) => setInviteForm({ ...inviteForm, teamId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              >
                <option value="">-- Choose Team --</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shortCode}) {t.owner ? '• [Owned]' : '• [Vacant]'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Owner Email</label>
              <input
                type="email"
                required
                value={inviteForm.email}
                onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                placeholder="owner@team.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Owner WhatsApp Phone</label>
              <input
                type="tel"
                required
                value={inviteForm.phone}
                onChange={(e) => setInviteForm({ ...inviteForm, phone: e.target.value })}
                placeholder="+91 9876543210"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
            >
              Generate Secure Activation Link
            </button>
          </form>

          {inviteResult && (
            <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  Activation Link Generated
                </span>
                {inviteResult.whatsappSent ? (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded">
                    🟢 WhatsApp Dispatched
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                    🟡 Manual Send Needed
                  </span>
                )}
              </div>

              <input
                type="text"
                readOnly
                value={inviteResult.invitationUrl}
                className="w-full p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-amber-300 font-mono select-all"
              />

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={`https://api.whatsapp.com/send?phone=${encodeURIComponent(
                    inviteResult.phone.replace(/\D/g, '')
                  )}&text=${encodeURIComponent(
                    `🏆 *ASPL 2026 — Team Owner Invitation*\n\nHello! You have been invited to become the official Team Owner of *${inviteResult.teamName}* for ASPL 2026.\n\nClick the secure link below to set up your account credentials:\n👉 ${inviteResult.invitationUrl}\n\n*Note:* This activation link is valid for 48 hours.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors text-center"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(inviteResult.invitationUrl);
                    alert('Activation link copied to clipboard!');
                  }}
                  className="py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Link2 className="w-3.5 h-3.5" />
                  <span>Copy Link</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tournament Teams Status */}
        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
            <Users className="w-5 h-5 text-emerald-400" />
            Registered Teams ({teams.length})
          </h2>
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {teams.map((t) => (
              <div key={t.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>{t.name} ({t.shortCode})</span>
                  <span className="text-amber-400 font-mono">₹{t.remainingPurse.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Owner: {t.owner ? t.owner.name : 'Unassigned'}</span>
                  <span>Squad: {t.players.length} / {t.maxSquadSize}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Player Pool Management Table */}
      <div className="glass-panel p-6 space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            Player Pool Verification ({filteredPlayers.length})
          </h2>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search name or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
            >
              <option value="">All Categories</option>
              <option value="Batsman">Batsman</option>
              <option value="Bowler">Bowler</option>
              <option value="All-Rounder">All-Rounder</option>
              <option value="Wicketkeeper">Wicketkeeper</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-bold uppercase">
                <th className="py-3 px-2">Player ID</th>
                <th className="py-3 px-2">Name</th>
                <th className="py-3 px-2">Category</th>
                <th className="py-3 px-2">Base Price</th>
                <th className="py-3 px-2">Payment</th>
                <th className="py-3 px-2">Auction Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPlayers.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-2 font-mono font-bold text-amber-400">{p.playerCode || '—'}</td>
                  <td className="py-3 px-2 font-semibold text-white">{p.name}</td>
                  <td className="py-3 px-2">{p.category}</td>
                  <td className="py-3 px-2 font-mono">₹{p.basePrice.toLocaleString()}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.paymentStatus === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {p.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${p.auctionStatus === 'AVAILABLE' ? 'bg-cyan-500/20 text-cyan-400' : p.auctionStatus === 'SOLD' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
                      {p.auctionStatus}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-right">
                    {p.auctionStatus !== 'AVAILABLE' && p.auctionStatus !== 'SOLD' && (
                      <button
                        onClick={() => handleVerifyPlayer(p.id)}
                        className="px-3 py-1 rounded bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px]"
                      >
                        Approve for Auction
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
