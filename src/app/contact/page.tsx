import Link from 'next/link';
import { Phone, Mail, MapPin, Clock, ArrowLeft, Send } from 'lucide-react';

export const metadata = {
  title: 'Contact Us | ASPL Cricket Tournament 2026',
  description: 'Official Contact and Support Page for ASPL Cricket Tournament 2026.',
};

export default function ContactPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-6 space-y-8 text-slate-300 text-sm">
      <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-extrabold">
          <Phone className="w-3.5 h-3.5" />
          <span>Support & Helpdesk</span>
        </div>
        <h1 className="text-4xl font-black text-white">Contact Us</h1>
        <p className="text-xs text-slate-400">Have questions regarding ASPL 2026 registration or auction? Reach out to our team.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* OFFICIAL CONTACT DETAILS CARD */}
        <div className="bento-card p-8 space-y-6 border-amber-500/30">
          <h2 className="text-xl font-black text-white border-b border-slate-800 pb-3">Official Organizing Committee</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Phone & WhatsApp Support</span>
                <strong className="text-white font-mono text-base">+91 97912 34315</strong>
                <p className="text-[11px] text-slate-500">Mon–Sat, 9:00 AM – 7:00 PM IST</p>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-slate-800/80 pt-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Official Email</span>
                <strong className="text-white text-sm">support@asplcricket.com</strong>
                <p className="text-[11px] text-slate-500">24/7 Player Helpdesk</p>
              </div>
            </div>

            <div className="flex items-start gap-3 border-t border-slate-800/80 pt-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 flex-shrink-0">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Tournament Office Address</span>
                <strong className="text-white text-xs">ASPL Cricket Tournament Secretariat</strong>
                <p className="text-xs text-slate-400 mt-0.5">Trichy / Chennai Region, Tamil Nadu - 621005, India</p>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK INQUIRY FORM */}
        <div className="bento-card p-8 space-y-4 border-slate-800">
          <h2 className="text-xl font-black text-white border-b border-slate-800 pb-3">Send a Message</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Your Name</label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Phone Number</label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Subject / Message</label>
              <textarea
                rows={3}
                placeholder="Describe your inquiry regarding player registration fee, payment, or squad selection auction..."
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
              ></textarea>
            </div>

            <button
              type="button"
              className="btn-neon-gold w-full py-3.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" /> Send Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
