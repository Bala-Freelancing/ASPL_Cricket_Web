'use client';

import Link from 'next/link';
import { Trophy, ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] bg-[#05070D] relative z-10 text-[#8C97AA] text-xs">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* BRAND & TOURNAMENT INFO */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#F5B800] text-[#05070D] flex items-center justify-center">
              <Trophy className="w-5 h-5 font-black" />
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight block leading-none">ASPL 2026</span>
              <span className="text-[10px] text-[#F5B800] font-semibold tracking-wider uppercase">All-Star Premier League</span>
            </div>
          </div>
          <p className="text-[#8C97AA] text-xs leading-relaxed">
            Official ASPL 2026 Player Registration & Real-Time Auction Platform. Powered by Cashfree Payments.
          </p>
        </div>

        {/* TOURNAMENT NAVIGATION */}
        <div className="space-y-3">
          <h4 className="font-bold text-white uppercase text-xs tracking-wider">Tournament</h4>
          <ul className="space-y-2.5">
            <li>
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
            </li>
            <li>
              <Link href="/#tournament" className="hover:text-white transition-colors">Tournament Overview</Link>
            </li>
            <li>
              <Link href="/#teams" className="hover:text-white transition-colors">Participating Teams</Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-white transition-colors">Player Registration</Link>
            </li>
          </ul>
        </div>

        {/* AUCTION NAVIGATION */}
        <div className="space-y-3">
          <h4 className="font-bold text-white uppercase text-xs tracking-wider">Auction & Portal</h4>
          <ul className="space-y-2.5">
            <li>
              <Link href="/spectator" className="hover:text-white transition-colors flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>Live Auction Broadcast</span>
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white transition-colors">Team Owner Login</Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-white transition-colors">Admin Console</Link>
            </li>
          </ul>
        </div>

        {/* LEGAL & SUPPORT */}
        <div className="space-y-3">
          <h4 className="font-bold text-white uppercase text-xs tracking-wider">Support & Policies</h4>
          <ul className="space-y-2.5">
            <li>
              <Link href="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
            </li>
            <li>
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/refund" className="hover:text-white transition-colors">Refund & Cancellation Policy</Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-white/[0.08] py-6 text-[11px] text-[#8C97AA]">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <span>© 2026 ASPL Cricket Tournament. All rights reserved.</span>
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" /> Verified Merchant for Cashfree Payment Gateway (RBI Compliant)
          </span>
        </div>
      </div>
    </footer>
  );
}
