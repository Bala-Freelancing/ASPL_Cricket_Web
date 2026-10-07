'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ShieldCheck, Lock, CreditCard, Smartphone, Building2, CheckCircle2 } from 'lucide-react';

function CashfreeCheckoutContent() {
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('208.00');
  const [customerName, setCustomerName] = useState('IPL Player');
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [loading, setLoading] = useState(false);
  const [upiId, setUpiId] = useState('player@upi');

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  useEffect(() => {
    setMounted(true);
    const id = searchParams.get('order_id') || searchParams.get('orderId') || 'cf_ord_sample';
    const amt = searchParams.get('amount') || '208.00';
    const name = searchParams.get('name') || 'IPL Player';
    setOrderId(id);
    setAmount(amt);
    setCustomerName(name);
  }, [searchParams]);

  const handlePayNow = async () => {
    setLoading(true);

    try {
      // Simulate gateway approval and return to return_url
      setTimeout(() => {
        const returnUrl = `${APP_URL}/register?order_id=${encodeURIComponent(orderId)}`;
        window.location.href = returnUrl;
      }, 1200);
    } catch (err) {
      console.error('Payment processing error:', err);
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex justify-center items-center">
        <div className="text-slate-400 text-xs font-bold animate-pulse">Loading Cashfree Payment Gateway...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
      {/* CASHFREE BRANDED HEADER */}
      <div className="w-full max-w-lg mb-4 flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center font-black text-sm">
            CF
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-wide uppercase">Cashfree Payments</h1>
            <p className="text-[10px] text-slate-400">Official Merchant Payment Gateway</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
          <Lock className="w-3.5 h-3.5" />
          <span>256-bit SSL Secure</span>
        </div>
      </div>

      {/* CHECKOUT CARD */}
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
        {/* ORDER SUMMARY HEADER */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-bold">
          <div>
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-semibold">Merchant</span>
            <span className="text-white text-sm">Mini IPL 2026 Tournament</span>
            <span className="text-slate-500 text-[10px] block font-mono">Order ID: {orderId}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 text-[10px] uppercase tracking-wider block font-semibold">Total Amount</span>
            <span className="text-emerald-400 text-2xl font-black font-mono">₹{amount}</span>
          </div>
        </div>

        {/* PAYMENT METHOD SELECTOR */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">Select Payment Mode</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setSelectedMethod('upi')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                selectedMethod === 'upi'
                  ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Smartphone className="w-5 h-5" />
              <span>UPI / QR</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('card')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                selectedMethod === 'card'
                  ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Cards</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedMethod('netbanking')}
              className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-2 transition-all ${
                selectedMethod === 'netbanking'
                  ? 'bg-teal-500/10 border-teal-500 text-teal-400 shadow-lg'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <Building2 className="w-5 h-5" />
              <span>NetBanking</span>
            </button>
          </div>
        </div>

        {/* METHOD DETAILS */}
        {selectedMethod === 'upi' && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold border-b border-slate-800 pb-2">
              <span>Fast Instant UPI Checkout</span>
              <span className="text-[10px] text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">Google Pay / PhonePe / Paytm</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 block">Virtual Payment Address (UPI ID):</label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="e.g. mobile@upi or name@okaxis"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
        )}

        {selectedMethod === 'card' && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 text-[11px]">Card Number</label>
              <input
                type="text"
                placeholder="4111 2222 3333 4444"
                defaultValue="4532 •••• •••• 8892"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 text-[11px]">Expiry</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  defaultValue="12/28"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[11px]">CVV</label>
                <input
                  type="password"
                  placeholder="•••"
                  defaultValue="123"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {selectedMethod === 'netbanking' && (
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
            <label className="text-slate-400 text-[11px] block">Popular Banks</label>
            <div className="grid grid-cols-2 gap-2 font-bold text-slate-300">
              <button type="button" className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left">HDFC Bank</button>
              <button type="button" className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left">ICICI Bank</button>
              <button type="button" className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left">SBI</button>
              <button type="button" className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-left">Axis Bank</button>
            </div>
          </div>
        )}

        {/* PRIMARY PAY BUTTON */}
        <button
          type="button"
          onClick={handlePayNow}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-teal-500/20 transition-all cursor-pointer"
        >
          {loading ? (
            <span>Processing Cashfree Payment...</span>
          ) : (
            <>
              <ShieldCheck className="w-5 h-5" />
              <span>Pay ₹{amount} via Cashfree Payment Gateway</span>
            </>
          )}
        </button>

        {/* FOOTER GUARANTEE */}
        <div className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5 pt-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
          <span>You will be redirected back to Mini IPL after completing payment.</span>
        </div>
      </div>
    </div>
  );
}

export default function CashfreeCheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex justify-center items-center">
        <div className="text-slate-400 text-xs font-bold animate-pulse">Initializing Cashfree Checkout...</div>
      </div>
    }>
      <CashfreeCheckoutContent />
    </Suspense>
  );
}
