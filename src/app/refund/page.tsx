import Link from 'next/link';
import { Coins, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';

export const metadata = {
  title: 'Refund & Cancellation Policy | ASPL Cricket Tournament 2026',
  description: 'Official Refund & Cancellation Policy for ASPL 2026 Player Registration.',
};

export default function RefundPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8 text-slate-300 text-sm">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-extrabold">
          <Coins className="w-3.5 h-3.5" />
          <span>Financial Policy</span>
        </div>
        <h1 className="text-4xl font-black text-white">Refund & Cancellation Policy</h1>
        <p className="text-xs text-slate-400">Last updated: October 2026 | ASPL Cricket Tournament 2026</p>
      </div>

      <div className="bento-card p-8 md:p-10 space-y-6 leading-relaxed border-slate-800">
        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">1. Registration Fee Overview</h2>
          <p>
            The payment of <strong>₹208.00 (Rupees Two Hundred and Eight Only)</strong> is strictly the <strong>One-time Player Registration Fee</strong> for the <strong>ASPL Cricket Tournament 2026</strong>. This fee covers administrative processing, player identity verification by tournament organizers, and entry into the official tournament player pool.
          </p>
          <p className="text-xs text-slate-400">
            The registration fee is exclusively for tournament registration. It is NOT a payment for auction participation, bidding, purchasing credits, winning a team, or winning a match.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">2. Refund Terms</h2>
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Duplicate / Failed Transaction Refunds:</strong>
                <p className="text-xs text-slate-400 mt-0.5">
                  If an amount is debited multiple times due to a network glitch or gateway timeout, any excess payment will be automatically refunded back to the original source account (UPI / Card / Netbanking) within <strong>5–7 working days</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 border-t border-slate-800 pt-3">
              <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Tournament Cancellation:</strong>
                <p className="text-xs text-slate-400 mt-0.5">
                  If the ASPL 2026 Cricket Tournament is completely cancelled by the organizing committee before commencement, a 100% full refund of ₹208 will be issued to all registered players.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">3. Non-Refundable Scenarios</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Voluntary Withdrawal:</strong> Once a player successfully registers, pays ₹208, and receives their Player ID Badge, voluntary player cancellation requests are non-refundable.</li>
            <li><strong>Auction Non-Selection:</strong> Registration fee guarantees entry into the player auction pool. Non-selection by team franchises during the live auction does not entitle a player to a fee refund.</li>
            <li><strong>Disqualification:</strong> Disqualification due to submission of fake Aadhaar details or violation of tournament rules is strictly non-refundable.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">4. Refund Process & Timelines</h2>
          <p>
            Approved registration refunds are initiated through our payment gateway (Cashfree Payments) directly to your original payment method (Bank Account / UPI ID / Debit Card). Refunds typically reflect within <strong>5 to 7 business days</strong> depending on your issuing bank.
          </p>
          <p className="text-xs text-slate-400">
            <em>Note: ASPL Credits are non-monetary tournament credits allocated by ASPL for player selection during the ASPL 2026 auction. They have no cash value and cannot be purchased, transferred, withdrawn, refunded, redeemed, or exchanged for money.</em>
          </p>
        </section>

        <section className="space-y-3 border-t border-slate-800 pt-4">
          <h2 className="text-base font-bold text-amber-400">Requesting Refund Support</h2>
          <p className="text-xs text-slate-400">
            For payment or refund assistance, email us with your <strong>Payment Reference / Order ID</strong> at <strong>support@asplcricket.com</strong> or call <strong>+91 97912 34315</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
