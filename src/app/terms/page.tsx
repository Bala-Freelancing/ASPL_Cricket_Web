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
          <h2 className="text-lg font-black text-white">1. Introduction & Acceptance</h2>
          <p>
            Welcome to the official registration portal of <strong>ASPL Cricket Tournament 2026</strong> (&quot;ASPL&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). By registering as a player or accessing our website, you agree to comply with and be bound by these Terms and Conditions. Please read them carefully before submitting your player application.
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
          <h2 className="text-lg font-black text-white">3. Registration & Payment Terms</h2>
          <p>
            An official player registration fee of <strong>₹208.00 (Inclusive of Taxes & Processing Fees)</strong> is required to complete registration. Payment is processed securely through Cashfree Payments PG.
          </p>
          <p>
            Upon successful payment verification, an official <strong>Player ID Badge (e.g. IPL26-P0001)</strong> and digital receipt will be issued and dispatched via WhatsApp.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">4. Tournament Auction & Selection</h2>
          <p>
            Registration fee guarantees entry into the ASPL 2026 Player Auction Pool. Team selection, bidding outcomes, and squad allocations are conducted in real time according to tournament rules. Registration does not guarantee selection by a team franchise.
          </p>
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
