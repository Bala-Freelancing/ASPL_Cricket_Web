import Link from 'next/link';
import { ShieldCheck, FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms & Conditions | ASPL Cricket Tournament 2026',
  description: 'Official Terms and Conditions for ASPL Cricket Tournament 2026 Player Registration.',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8 text-slate-300 text-sm">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold">
          <FileText className="w-3.5 h-3.5" />
          <span>Legal Agreement</span>
        </div>
        <h1 className="text-4xl font-black text-white">Terms & Conditions</h1>
        <p className="text-xs text-slate-400">Last updated: October 2026 | ASPL Cricket Tournament 2026</p>
      </div>

      <div className="bento-card p-8 md:p-10 space-y-6 leading-relaxed border-slate-800">
        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">1. Introduction & Business Model</h2>
          <p>
            Welcome to the official registration portal of <strong>ASPL Cricket Tournament 2026</strong> (&quot;ASPL&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). ASPL 2026 is an offline cricket tournament registration and tournament management platform. Players pay a one-time ₹208 registration fee to participate in the tournament. Registered players are verified by tournament organizers and may subsequently be selected by authorized team owners through an organizer-managed live player auction.
          </p>
          <p>
            The player auction is a tournament squad-selection process and is not a betting or gambling activity. No participant wagers money, and no participant receives money based on match or auction outcomes. By registering as a player or accessing our website, you agree to comply with and be bound by these Terms and Conditions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">2. Player Eligibility</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Applicants must provide valid identification (12-digit Aadhaar Card) and accurate age/dob details during registration.</li>
            <li>Players must follow all tournament guidelines and code of conduct set by the ASPL Organizing Committee.</li>
            <li>Providing false identity details or fraudulent documentation will result in immediate disqualification without refund.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">3. Player Registration Fee & Payment Terms</h2>
          <p>
            An official <strong>One-time ASPL 2026 Player Registration Fee</strong> of <strong>₹208.00 (Inclusive of Taxes & Processing Fees)</strong> is required to complete player registration. Payment is processed securely through our payment gateway (Cashfree Payments).
          </p>
          <p>
            Upon successful payment verification, an official <strong>Player ID Badge (e.g. IPL26-P0001)</strong> and digital receipt will be issued and dispatched via WhatsApp. Payment is strictly the tournament player registration fee and does not constitute a fee for bidding, auction participation, or gambling.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">4. ASPL Auction Credits & Squad Selection Rules</h2>
          <p>
            Registration fee guarantees verified entry into the ASPL 2026 Player Pool for squad selection. Squad selection during the auction is conducted using organizer-allocated <strong>ASPL Credits</strong>.
          </p>
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1">
            <strong className="block text-white font-bold">Important Notice on ASPL Credits:</strong>
            <p>
              ASPL Credits are non-monetary tournament credits allocated by ASPL for player selection during the ASPL 2026 auction. They have no cash value and cannot be purchased, transferred, withdrawn, refunded, redeemed, or exchanged for money. Credits are used exclusively for tournament squad selection. There is zero betting, gambling, wagering, or cash payouts based on match or auction outcomes.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">5. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising in connection with the tournament shall be subject to the exclusive jurisdiction of the courts in Tamil Nadu, India.
          </p>
        </section>

        <section className="space-y-3 border-t border-slate-800 pt-4">
          <h2 className="text-base font-bold text-amber-400">Contact Committee</h2>
          <p className="text-xs text-slate-400">
            For questions regarding Terms & Conditions, contact us at <strong>support@asplcricket.com</strong> or call <strong>+91 97912 34315</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
