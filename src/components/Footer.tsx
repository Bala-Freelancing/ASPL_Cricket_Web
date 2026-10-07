'use client';

import Link from 'next/link';
import { Trophy, ShieldCheck, Mail, Phone, MapPin, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md mt-20 relative z-10 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* BRAND & TOURNAMENT INFO */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20">
              <Trophy className="w-5 h-5 font-black" />
            </div>
            <div>
              <span className="font-black text-white text-base tracking-wider block leading-none">ASPL 2026</span>
              <span className="text-[10px] text-amber-400 font-bold tracking-widest uppercase">Cricket Tournament</span>
            </div>
          </div>
          <p className="text-slate-400 text-xs leading-relaxed">
            Official All-Star Premier League (ASPL 2026) Player Registration & Live Auction Platform. Powered by Cashfree Payments.
          </p>
        </div>

        {/* QUICK NAVIGATION */}
        <div className="space-y-3">
          <h4 className="font-black text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-2">Navigation</h4>
          <ul className="space-y-2">
            <li>
              <Link href="/" className="hover:text-amber-400 transition-colors">Home & Features</Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-amber-400 transition-colors">Player Registration (₹208)</Link>
            </li>
            <li>
              <Link href="/spectator" className="hover:text-amber-400 transition-colors">Live Auction Stage</Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-amber-400 transition-colors">Team Owner / Admin Portal</Link>
            </li>
          </ul>
        </div>

        {/* CASHFREE MANDATORY LEGAL COMPLIANCE LINKS */}
        <div className="space-y-3">
          <h4 className="font-black text-amber-400 uppercase text-xs tracking-wider border-b border-slate-800 pb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Legal & Policies
          </h4>
          <ul className="space-y-2">
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
              <Link href="/contact" className="hover:text-white transition-colors">Contact Us & Support</Link>
            </li>
          </ul>
        </div>

        {/* SUPPORT CONTACT INFO */}
        <div className="space-y-3">
          <h4 className="font-black text-white uppercase text-xs tracking-wider border-b border-slate-800 pb-2">Support & Contact</h4>
          <div className="space-y-2.5">
            <div className="flex items-start gap-2 text-slate-300">
              <Phone className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>+91 97912 34315</span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <Mail className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>support@asplcricket.com</span>
            </div>
            <div className="flex items-start gap-2 text-slate-400">
              <MapPin className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>ASPL Cricket Organizing Committee, Tamil Nadu, India</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-900 py-6 text-center text-[11px] text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <span>© 2026 ASPL Cricket Tournament. All rights reserved.</span>
          <span>Verified Merchant for Cashfree Payment Gateway (RBI Compliant)</span>
        </div>
      </div>
    </footer>
  );
}
