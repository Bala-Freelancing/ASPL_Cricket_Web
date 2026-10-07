'use client';

import Link from 'next/link';
import { Trophy, UserCheck, ShieldAlert, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

import { io } from 'socket.io-client';

import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuctionLive, setIsAuctionLive] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://aspl-cricket-web.onrender.com';

    // Check if an auction is currently active
    const checkAuctionStatus = () => {
      fetch(`${apiUrl}/api/auction/current`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.auction && (data.auction.state === 'ACTIVE' || data.auction.state === 'PAUSED')) {
            setIsAuctionLive(true);
          } else {
            setIsAuctionLive(false);
          }
        })
        .catch(() => {
          setIsAuctionLive(false);
        });
    };

    checkAuctionStatus();
    const interval = setInterval(checkAuctionStatus, 3000); // Check status every 3 seconds

    // Real-time socket sync
    const socket = io(apiUrl);
    socket.emit('auction:join');

    socket.on('auction:started', () => {
      setIsAuctionLive(true);
    });

    socket.on('auction:state_sync', (data: any) => {
      if (data && data.auction && (data.auction.state === 'ACTIVE' || data.auction.state === 'PAUSED')) {
        setIsAuctionLive(true);
      } else {
        setIsAuctionLive(false);
      }
    });

    socket.on('auction:sold', () => {
      setIsAuctionLive(false);
    });

    socket.on('auction:unsold', () => {
      setIsAuctionLive(false);
    });

    return () => {
      clearInterval(interval);
      socket.disconnect();
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  if (pathname === '/register') {
    return (
      <header className="w-full h-16 border-b border-white/[0.08] bg-[#05070D]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-[1200px] h-full mx-auto px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-[#FFC928] text-[#05070D] font-black flex items-center justify-center shadow-lg shadow-[#FFC928]/10">
              <Trophy className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block leading-none">ASPL 2026</span>
              <span className="text-[9px] text-[#94A3B8] font-semibold tracking-wider uppercase">ALL-STAR PREMIER LEAGUE</span>
            </div>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-[#94A3B8] hover:text-[#FFC928] transition-colors flex items-center gap-1.5"
          >
            ← Back to Home
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full h-20 border-b border-white/[0.08] bg-[#05070D]/85 backdrop-blur-md sticky top-0 z-50 transition-colors">
      <div className="max-w-[1200px] h-full mx-auto px-6 md:px-8 flex items-center justify-between gap-6">
        {/* BRAND / LOGO */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-[#FFC928] text-[#080A0F] font-black flex items-center justify-center shadow-lg shadow-[#FFC928]/10">
            <Trophy className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-white block leading-none">ASPL 2026</span>
            <span className="text-[10px] text-[#8C97AA] font-semibold tracking-wider uppercase">All-Star Premier League</span>
          </div>
        </Link>

        {/* DESKTOP NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#8C97AA]">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <Link href="/#tournament" className="hover:text-white transition-colors">
            Tournament
          </Link>
          <Link href="/#teams" className="hover:text-white transition-colors">
            Teams
          </Link>
          {isAuctionLive ? (
            <Link href="/spectator" className="flex items-center gap-2 hover:text-white transition-colors text-white font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Auction</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded tracking-wider uppercase">
                LIVE
              </span>
            </Link>
          ) : (
            <Link href="/spectator" className="hover:text-white transition-colors">
              Auction
            </Link>
          )}
        </nav>

        {/* DESKTOP USER / CTA BUTTONS */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {user.role === 'ADMIN' && (
                <Link
                  href="/admin/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/10 text-[#F5B800] text-xs font-bold border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Admin Console</span>
                </Link>
              )}
              {user.role === 'TEAM_OWNER' && (
                <Link
                  href="/owner/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{user.team?.name || 'Owner Dashboard'}</span>
                </Link>
              )}
              {user.role === 'PLAYER' && (
                <Link
                  href="/player/dashboard"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Player Portal</span>
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="p-2 text-[#8C97AA] hover:text-rose-400 transition-colors rounded-lg bg-[#0B101C] border border-white/[0.08]"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="btn-secondary-dark px-4 py-2.5 rounded-lg text-xs font-semibold"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="btn-gold px-5 py-2.5 rounded-lg text-xs font-bold tracking-wide"
              >
                Register Player
              </Link>
            </div>
          )}
        </div>

        {/* MOBILE HAMBURGER BUTTON */}
        <div className="flex md:hidden items-center gap-3">
          <Link
            href="/register"
            className="btn-gold px-3.5 py-1.5 rounded-lg text-xs font-bold"
          >
            Register
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#8C97AA] hover:text-white rounded-lg bg-[#0B101C] border border-white/[0.08]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MOBILE DROPDOWN MENU */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#05070D] border-b border-white/[0.08] px-6 py-4 space-y-3 text-sm">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#8C97AA] hover:text-white"
          >
            Home
          </Link>
          <Link
            href="/#tournament"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#8C97AA] hover:text-white"
          >
            Tournament
          </Link>
          <Link
            href="/#teams"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#8C97AA] hover:text-white"
          >
            Teams
          </Link>
          <Link
            href="/spectator"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 text-[#8C97AA] hover:text-white flex items-center gap-2"
          >
            {isAuctionLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-white font-semibold">Auction Stage (LIVE)</span>
              </>
            ) : (
              <span>Auction Stage</span>
            )}
          </Link>
          <div className="pt-2 border-t border-white/[0.08] flex items-center gap-3">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-secondary-dark w-1/2 py-2.5 rounded-lg text-xs text-center"
            >
              Login
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-gold w-1/2 py-2.5 rounded-lg text-xs text-center font-bold"
            >
              Register Player
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
