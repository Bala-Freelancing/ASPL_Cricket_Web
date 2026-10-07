import Link from 'next/link';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | ASPL Cricket Tournament 2026',
  description: 'Official Privacy Policy for ASPL Cricket Tournament 2026.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8 text-slate-300 text-sm">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-extrabold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Data Protection</span>
        </div>
        <h1 className="text-4xl font-black text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Last updated: October 2026 | ASPL Cricket Tournament 2026</p>
      </div>

      <div className="bento-card p-8 md:p-10 space-y-6 leading-relaxed border-slate-800">
        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">1. Information We Collect</h2>
          <p>
            When you register for ASPL Cricket Tournament 2026, we collect personal details necessary for tournament operations, identity verification, and payment processing:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Full Name, Date of Birth, Age, and Pincode</li>
            <li>Contact details (WhatsApp Phone Number, Email Address)</li>
            <li>Cricket profile (Playing Role, Batting/Bowling style, T-Shirt size, Bio)</li>
            <li>Government-issued ID (12-digit Aadhaar Number & document scan for identity verification)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">2. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To verify player identity and issue official ASPL Player Badges (e.g. IPL26-P0001).</li>
            <li>To dispatch payment receipts and tournament updates via WhatsApp and Email.</li>
            <li>To display player statistics during the live auction to authorized team franchises.</li>
            <li>To process secure ₹208 registration payments via Cashfree Payment Gateway.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">3. Data Security & Storage</h2>
          <p>
            We implement strict security measures, including SSL encryption, database access controls, and server-side verification to protect your personal data. We do NOT store credit/debit card numbers or UPI PINs; all financial transactions are securely handled directly by Cashfree Payments (PCI-DSS Compliant).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-white">4. Third-Party Sharing</h2>
          <p>
            We do not sell, trade, or rent your personal information to third parties. Data is shared exclusively with Cashfree Payments for transaction verification and Baileys WhatsApp Service for automated receipt dispatch.
          </p>
        </section>

        <section className="space-y-3 border-t border-slate-800 pt-4">
          <h2 className="text-base font-bold text-amber-400">Data Privacy Support</h2>
          <p className="text-xs text-slate-400">
            For privacy inquiries or data requests, contact our Privacy Officer at <strong>support@asplcricket.com</strong>.
          </p>
        </section>
      </div>
    </div>
  );
}
