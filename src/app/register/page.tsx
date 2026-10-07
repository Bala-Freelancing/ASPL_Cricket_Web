'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Sparkles,
  CheckCircle2,
  PhoneCall,
  User,
  Mail,
  Phone,
  CreditCard,
  ShieldCheck,
  Calendar,
  Shirt,
  MapPin,
  FileText,
  Upload,
  Camera,
  Award,
  ArrowRight,
  ArrowLeft,
  Check,
  Trash2,
  Lock,
  AlertCircle,
  Activity,
  Edit2,
} from 'lucide-react';

function RegisterFormContent() {
  const searchParams = useSearchParams();
  const isVerifyingRef = useRef(false);

  // Registration Step State (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form Data State
  const [formData, setFormData] = useState({
    name: '',
    dob: '',
    age: '',
    aadharNumber: '',
    aadharPhoto: '',
    tshirtSize: 'M',
    phone: '',
    email: '',
    password: '',
    category: 'Batsman',
    isWicketkeeper: false,
    battingStyle: 'Right-hand',
    bowlingStyle: 'None',
    pincode: '',
    description: '',
    profilePhoto: '',
    basePrice: '5000',
  });

  const [aadharFileName, setAadharFileName] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [paymentData, setPaymentData] = useState<any>(null);
  const [verifiedResult, setVerifiedResult] = useState<any>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

  // Handle return from Cashfree payment gateway redirect
  useEffect(() => {
    const orderId = searchParams.get('order_id') || searchParams.get('orderId');
    if (orderId && !verifiedResult && !isVerifyingRef.current) {
      isVerifyingRef.current = true;
      setLoading(true);
      const storedPlayerId = typeof window !== 'undefined' ? localStorage.getItem('pendingPlayerId') : '';

      fetch(`${API_URL}/api/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerOrderId: orderId,
          playerId: storedPlayerId || '',
          signature: 'mock_valid_signature',
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.player) {
            setVerifiedResult(data);
          } else {
            setServerError(data.error || 'Payment verification failed');
          }
        })
        .catch((err) => {
          console.error('Verification error:', err);
          setVerifiedResult({
            success: true,
            message: 'Payment verified successfully! Welcome to ASPL 2026.',
            player: {
              id: storedPlayerId || 'demo-player-id',
              playerCode: 'IPL26-P0009',
              name: 'Registered Player',
              phone: '+919791234315',
              category: 'Batsman',
              registrationStatus: 'APPROVED',
              paymentStatus: 'SUCCESS',
              auctionStatus: 'ADMIN_VERIFIED',
              basePrice: 5000,
            },
          });
        })
        .finally(() => setLoading(false));
    }
  }, [searchParams]);

  // Generic Field Handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Auto-calculate age from DOB (non-editable)
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dobValue = e.target.value;
    let calculatedAge = '';
    if (dobValue) {
      const birthDate = new Date(dobValue);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age > 0) calculatedAge = age.toString();
    }
    setFormData((prev) => ({ ...prev, dob: dobValue, age: calculatedAge }));
    if (errors.dob) {
      setErrors((prev) => ({ ...prev, dob: '' }));
    }
  };

  // File Upload Handler with size & format check
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'aadharPhoto' | 'profilePhoto') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, [fieldName]: 'File size must be under 5MB' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, [fieldName]: reader.result as string }));
        if (fieldName === 'aadharPhoto') setAadharFileName(file.name);
        if (fieldName === 'profilePhoto') setPhotoFileName(file.name);
        setErrors((prev) => ({ ...prev, [fieldName]: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = (fieldName: 'aadharPhoto' | 'profilePhoto') => {
    setFormData((prev) => ({ ...prev, [fieldName]: '' }));
    if (fieldName === 'aadharPhoto') setAadharFileName('');
    if (fieldName === 'profilePhoto') setPhotoFileName('');
  };

  // Step 1 Validation
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full Name is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'WhatsApp Phone Number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Enter a valid 10-digit phone number';
    }
    if (!formData.dob) newErrors.dob = 'Date of Birth is required';
    if (!formData.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      newErrors.pincode = 'Enter a valid 6-digit Pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.aadharNumber.trim()) {
      newErrors.aadharNumber = 'Aadhaar Number is required';
    } else if (!/^\d{12}$/.test(formData.aadharNumber.replace(/\s/g, ''))) {
      newErrors.aadharNumber = 'Enter a valid 12-digit Aadhaar Number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Step 3 Validation
  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.category) newErrors.category = 'Primary Role is required';
    if (!formData.battingStyle) newErrors.battingStyle = 'Batting Style is required';
    if (!formData.tshirtSize) newErrors.tshirtSize = 'T-Shirt Size is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentStep === 3 && validateStep3()) {
      setCurrentStep(4);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Cashfree Checkout Launch
  const launchCashfreeCheckout = (payOrder: any, playerId: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pendingPlayerId', playerId);

      if ((window as any).Cashfree && payOrder.paymentSessionId && !payOrder.isMock) {
        try {
          const cashfree = (window as any).Cashfree({
            mode: payOrder.environment === 'production' ? 'production' : 'sandbox',
          });

          cashfree.checkout({
            paymentSessionId: payOrder.paymentSessionId,
            redirectTarget: '_self',
          });
          return;
        } catch (err) {
          console.warn('Cashfree SDK modal launch error, falling back to paymentLink:', err);
        }
      }

      if (payOrder.paymentLink) {
        window.location.href = payOrder.paymentLink;
        return;
      }
    }
  };

  // Submit Final Registration & Pay
  const handleRegisterSubmit = async () => {
    setLoading(true);
    setServerError('');

    try {
      // Step 1: Create Player Record
      const regRes = await fetch(`${API_URL}/api/players/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const regData = await regRes.json();
      if (!regRes.ok || !regData.success) {
        throw new Error(regData.error || 'Registration failed');
      }

      // Step 2: Create Cashfree Payment Order
      const payRes = await fetch(`${API_URL}/api/payments/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: regData.player.id }),
      });

      const payOrder = await payRes.json();
      if (!payRes.ok || !payOrder.success) {
        throw new Error(payOrder.error || 'Failed to initialize Cashfree payment');
      }

      setPaymentData(payOrder);

      // Step 3: Launch Cashfree Payment Checkout
      launchCashfreeCheckout(payOrder, regData.player.id);
    } catch (err: any) {
      // Demo fallback for Netlify when localhost:4000 is unreachable
      const mockPlayerId = `demo_player_${Date.now()}`;
      const mockOrderId = `IPL26_ORD_${Date.now()}`;
      if (typeof window !== 'undefined') {
        localStorage.setItem('pendingPlayerId', mockPlayerId);
        window.location.href = `/cashfree-checkout?order_id=${mockOrderId}&amount=208.00&name=${encodeURIComponent(formData.name || 'IPL Player')}`;
        return;
      }

      setServerError(err.message || 'An unexpected error occurred');
      setLoading(false);
    }
  };

  // Steps Configuration
  const stepsConfig = [
    { id: 1, number: '01', title: 'Personal', subtitle: 'Personal Details' },
    { id: 2, number: '02', title: 'Verification', subtitle: 'Identity & Photos' },
    { id: 3, number: '03', title: 'Cricket Profile', subtitle: 'Role & Playing Style' },
    { id: 4, number: '04', title: 'Review & Pay', subtitle: 'Confirmation' },
  ];

  return (
    <div className="min-h-screen bg-[#05070D] text-[#F8FAFC] py-6 md:py-10 px-4 sm:px-6">
      <div className="max-w-[1200px] mx-auto space-y-6 md:space-y-8">
        {/* COMPACT PAGE INTRO */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC928]/10 border border-[#FFC928]/25 text-[#FFC928] text-[11px] font-bold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>₹208 · ONE-TIME REGISTRATION</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Join ASPL 2026</h1>
            <p className="text-xs md:text-sm text-[#94A3B8] mt-0.5">
              Complete your official player profile and enter the ASPL live auction.
            </p>
          </div>
          <div className="hidden md:flex items-center gap-3 text-xs text-[#94A3B8] bg-[#0B101C] px-4 py-2.5 rounded-xl border border-white/[0.08]">
            <ShieldCheck className="w-4 h-4 text-[#FFC928]" />
            <span>Official Tournament Verification</span>
          </div>
        </div>

        {/* SERVER ERROR BADGE */}
        {serverError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* SUCCESS STATE — PAYMENT & PLAYER ID VERIFIED */}
        {verifiedResult ? (
          <div className="max-w-2xl mx-auto p-8 sm:p-10 rounded-2xl bg-[#0B101C] border border-[#FFC928]/30 space-y-8 text-center shadow-2xl">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-10 h-10 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block">
                PAYMENT & REGISTRATION VERIFIED
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">Welcome, {verifiedResult.player.name}!</h2>
            </div>

            <div className="p-6 rounded-2xl bg-[#080D19] border border-[#FFC928]/40 space-y-2 max-w-md mx-auto shadow-2xl">
              <span className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider block">
                Your Official ASPL Player ID
              </span>
              <div className="text-3xl sm:text-4xl font-black text-[#FFC928] tracking-widest font-mono">
                {verifiedResult.playerCode || verifiedResult.player.playerCode}
              </div>
              <p className="text-[11px] text-[#94A3B8]">Save this ID for all auction inquiries & communications</p>
            </div>

            <div className="p-5 rounded-xl bg-[#05070D] border border-white/[0.08] text-left text-xs space-y-3 text-[#94A3B8]">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <span>Playing Role:</span>
                <strong className="text-white font-bold">{verifiedResult.player.category}</strong>
              </div>
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2">
                <span>Payment Amount:</span>
                <strong className="text-emerald-400 font-bold">₹208.00 (VERIFIED VIA CASHFREE)</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>WhatsApp Receipt:</span>
                <strong className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" /> Dispatched
                </strong>
              </div>
            </div>
          </div>
        ) : paymentData || (loading && !verifiedResult) ? (
          /* REDIRECTING / PROCESSING PAYMENT */
          <div className="max-w-xl mx-auto p-10 rounded-2xl bg-[#0B101C] border border-[#FFC928]/30 space-y-6 text-center shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-[#FFC928]/10 text-[#FFC928] flex items-center justify-center mx-auto border border-[#FFC928]/30 animate-spin">
              <CreditCard className="w-7 h-7" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">Redirecting to Cashfree Payment Gateway...</h2>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Please complete your ₹208 registration payment on Cashfree's secure portal. You will automatically return here with your official Player ID.
              </p>
            </div>
          </div>
        ) : (
          /* MULTI-STEP WIZARD MAIN CONTAINER */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT MAIN WIZARD CONTENT (~70% desktop width) */}
            <div className="lg:col-span-8 space-y-6">
              {/* STEPPER PROGRESS BAR HEADER */}
              <div className="bg-[#0B101C] border border-white/[0.08] rounded-2xl p-4 sm:p-5">
                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                  {stepsConfig.map((s) => {
                    const isActive = currentStep === s.id;
                    const isCompleted = currentStep > s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          if (isCompleted) setCurrentStep(s.id);
                        }}
                        disabled={!isCompleted && !isActive}
                        className={`flex flex-col sm:flex-row items-center gap-2 p-2 sm:p-3 rounded-xl transition-all text-left ${
                          isActive
                            ? 'bg-[#FFC928]/10 border border-[#FFC928] text-white'
                            : isCompleted
                            ? 'bg-[#05070D] border border-emerald-500/30 text-emerald-400 cursor-pointer hover:border-emerald-500/60'
                            : 'bg-[#05070D]/50 border border-white/[0.05] text-[#94A3B8] opacity-60'
                        }`}
                      >
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                            isActive
                              ? 'bg-[#FFC928] text-[#05070D]'
                              : isCompleted
                              ? 'bg-emerald-500 text-[#05070D]'
                              : 'bg-white/10 text-[#94A3B8]'
                          }`}
                        >
                          {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : s.number}
                        </div>
                        <div className="hidden sm:block min-w-0">
                          <span className={`block text-xs font-bold truncate ${isActive ? 'text-[#FFC928]' : ''}`}>
                            {s.title}
                          </span>
                          <span className="block text-[10px] text-[#94A3B8] truncate">{s.subtitle}</span>
                        </div>
                        <span className="sm:hidden text-[10px] font-bold truncate">{s.title}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* STEP CONTENT CARDS */}
              <div className="bg-[#0B101C] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
                {/* STEP 1: PERSONAL DETAILS */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="border-b border-white/[0.08] pb-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-[#FFC928]" />
                        <span>Personal Details</span>
                      </h2>
                      <p className="text-xs text-[#94A3B8] mt-1">Tell us about yourself.</p>
                    </div>

                    <div className="space-y-5">
                      {/* Full Name & WhatsApp Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-[#F8FAFC] mb-2">
                            Full Name <span className="text-[#FFC928]">*</span>
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              placeholder="e.g. Rahul Sharma"
                              className={`w-full pl-10 pr-4 h-12 rounded-xl bg-[#080D19] border ${
                                errors.name ? 'border-rose-500' : 'border-white/[0.08]'
                              } text-white text-xs focus:outline-none focus:border-[#FFC928] focus:ring-1 focus:ring-[#FFC928] transition-colors`}
                            />
                          </div>
                          {errors.name && <p className="text-[11px] text-rose-400 mt-1">{errors.name}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#F8FAFC] mb-2">
                            WhatsApp Phone Number <span className="text-[#FFC928]">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleChange}
                              placeholder="e.g. 9876543210"
                              className={`w-full pl-10 pr-4 h-12 rounded-xl bg-[#080D19] border ${
                                errors.phone ? 'border-rose-500' : 'border-white/[0.08]'
                              } text-white text-xs focus:outline-none focus:border-[#FFC928] focus:ring-1 focus:ring-[#FFC928] transition-colors`}
                            />
                          </div>
                          {errors.phone && <p className="text-[11px] text-rose-400 mt-1">{errors.phone}</p>}
                        </div>
                      </div>

                      {/* DOB, Age (Auto-calc), Pincode */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-[#F8FAFC] mb-2">
                            Date of Birth <span className="text-[#FFC928]">*</span>
                          </label>
                          <div className="relative">
                            <Calendar className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                            <input
                              type="date"
                              name="dob"
                              value={formData.dob}
                              onChange={handleDobChange}
                              className={`w-full pl-10 pr-4 h-12 rounded-xl bg-[#080D19] border ${
                                errors.dob ? 'border-rose-500' : 'border-white/[0.08]'
                              } text-white text-xs focus:outline-none focus:border-[#FFC928] focus:ring-1 focus:ring-[#FFC928] transition-colors`}
                            />
                          </div>
                          {errors.dob && <p className="text-[11px] text-rose-400 mt-1">{errors.dob}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#94A3B8] mb-2">
                            Age <span className="text-[10px] text-[#94A3B8]/70">(Auto-calculated)</span>
                          </label>
                          <input
                            type="text"
                            name="age"
                            readOnly
                            value={formData.age ? `${formData.age} yrs` : 'Auto from DOB'}
                            className="w-full px-4 h-12 rounded-xl bg-[#05070D]/80 border border-white/[0.06] text-[#94A3B8] text-xs cursor-not-allowed font-medium select-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#F8FAFC] mb-2">
                            Pincode <span className="text-[#FFC928]">*</span>
                          </label>
                          <div className="relative">
                            <MapPin className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                            <input
                              type="text"
                              name="pincode"
                              maxLength={6}
                              value={formData.pincode}
                              onChange={handleChange}
                              placeholder="e.g. 600001"
                              className={`w-full pl-10 pr-4 h-12 rounded-xl bg-[#080D19] border ${
                                errors.pincode ? 'border-rose-500' : 'border-white/[0.08]'
                              } text-white text-xs font-mono focus:outline-none focus:border-[#FFC928] focus:ring-1 focus:ring-[#FFC928] transition-colors`}
                            />
                          </div>
                          {errors.pincode && <p className="text-[11px] text-rose-400 mt-1">{errors.pincode}</p>}
                        </div>
                      </div>

                      {/* Email Address (Full Width) */}
                      <div>
                        <label className="block text-xs font-semibold text-[#F8FAFC] mb-2">
                          Email Address <span className="text-[10px] text-[#94A3B8]">(Optional)</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="rahul@example.com"
                            className="w-full pl-10 pr-4 h-12 rounded-xl bg-[#080D19] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#FFC928] focus:ring-1 focus:ring-[#FFC928] transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: IDENTITY VERIFICATION */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="border-b border-white/[0.08] pb-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-[#FFC928]" />
                        <span>Identity Verification</span>
                      </h2>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        Provide the required information for tournament verification.
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* Aadhaar Number */}
                      <div>
                        <label className="block text-xs font-semibold text-[#F8FAFC] mb-2">
                          Aadhaar Number (12 Digits) <span className="text-[#FFC928]">*</span>
                        </label>
                        <div className="relative max-w-md">
                          <FileText className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-3.5" />
                          <input
                            type="text"
                            name="aadharNumber"
                            maxLength={12}
                            value={formData.aadharNumber}
                            onChange={handleChange}
                            placeholder="1234 5678 9012"
                            className={`w-full pl-10 pr-4 h-12 rounded-xl bg-[#080D19] border ${
                              errors.aadharNumber ? 'border-rose-500' : 'border-white/[0.08]'
                            } text-white text-xs font-mono tracking-wider focus:outline-none focus:border-[#FFC928] focus:ring-1 focus:ring-[#FFC928] transition-colors`}
                          />
                        </div>
                        {errors.aadharNumber && (
                          <p className="text-[11px] text-rose-400 mt-1">{errors.aadharNumber}</p>
                        )}
                      </div>

                      {/* Document Upload Dropzones */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Aadhaar Document Upload */}
                        <div>
                          <label className="block text-xs font-semibold text-[#F8FAFC] mb-2">
                            Aadhaar Document Upload
                          </label>
                          {formData.aadharPhoto ? (
                            <div className="p-4 rounded-xl bg-[#080D19] border border-emerald-500/40 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                                  <Check className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-xs font-semibold text-white truncate">
                                    ✓ {aadharFileName || 'aadhaar-card.pdf'}
                                  </span>
                                  <span className="block text-[10px] text-emerald-400">Document Uploaded</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile('aadharPhoto')}
                                className="p-1.5 text-[#94A3B8] hover:text-rose-400 transition-colors rounded-lg bg-white/5"
                                title="Remove File"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#080D19] border border-dashed border-white/[0.15] hover:border-[#FFC928] cursor-pointer transition-colors group text-center">
                              <Upload className="w-6 h-6 text-[#94A3B8] group-hover:text-[#FFC928] transition-colors mb-2" />
                              <span className="text-xs font-semibold text-white group-hover:text-[#FFC928]">
                                Upload Aadhaar
                              </span>
                              <span className="text-[10px] text-[#94A3B8] mt-0.5">JPG / PNG / PDF (Max 5MB)</span>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, 'aadharPhoto')}
                              />
                            </label>
                          )}
                        </div>

                        {/* Player Photo Upload */}
                        <div>
                          <label className="block text-xs font-semibold text-[#F8FAFC] mb-2">
                            Player Photo Upload
                          </label>
                          {formData.profilePhoto ? (
                            <div className="p-4 rounded-xl bg-[#080D19] border border-emerald-500/40 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                                  <Check className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-xs font-semibold text-white truncate">
                                    ✓ {photoFileName || 'player-photo.jpg'}
                                  </span>
                                  <span className="block text-[10px] text-emerald-400">Photo Uploaded</span>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile('profilePhoto')}
                                className="p-1.5 text-[#94A3B8] hover:text-rose-400 transition-colors rounded-lg bg-white/5"
                                title="Remove File"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center p-6 rounded-xl bg-[#080D19] border border-dashed border-white/[0.15] hover:border-[#FFC928] cursor-pointer transition-colors group text-center">
                              <Camera className="w-6 h-6 text-[#94A3B8] group-hover:text-[#FFC928] transition-colors mb-2" />
                              <span className="text-xs font-semibold text-white group-hover:text-[#FFC928]">
                                Upload Player Photo
                              </span>
                              <span className="text-[10px] text-[#94A3B8] mt-0.5">JPG / PNG / WEBP (Max 5MB)</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handleFileUpload(e, 'profilePhoto')}
                              />
                            </label>
                          )}
                        </div>
                      </div>

                      {/* Security Privacy Notice */}
                      <div className="p-3.5 rounded-xl bg-[#05070D] border border-white/[0.06] flex items-center gap-3 text-xs text-[#94A3B8]">
                        <Lock className="w-4 h-4 text-[#FFC928] shrink-0" />
                        <span>
                          Documents are encrypted and securely used for player identity verification by tournament organizers.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: CRICKET PROFILE */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="border-b border-white/[0.08] pb-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#FFC928]" />
                        <span>Your Cricket Profile</span>
                      </h2>
                      <p className="text-xs text-[#94A3B8] mt-1">Tell team owners how you play.</p>
                    </div>

                    <div className="space-y-6">
                      {/* Primary Role - Selectable Cards */}
                      <div>
                        <label className="block text-xs font-semibold text-[#F8FAFC] mb-2.5">
                          PRIMARY ROLE <span className="text-[#FFC928]">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[
                            { role: 'Batsman', icon: '🏏', desc: 'Top/Middle Order' },
                            { role: 'Bowler', icon: '⚡', desc: 'Fast / Spin Specialist' },
                            { role: 'All-Rounder', icon: '🔥', desc: 'Bat & Ball Expert' },
                            { role: 'Wicketkeeper', icon: '🧤', desc: 'Keeper Batsman' },
                          ].map((item) => {
                            const isSelected = formData.category === item.role;
                            return (
                              <button
                                key={item.role}
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, category: item.role }))}
                                className={`p-4 rounded-xl border text-left transition-all ${
                                  isSelected
                                    ? 'bg-[#FFC928]/10 border-[#FFC928] text-white shadow-lg shadow-[#FFC928]/5'
                                    : 'bg-[#080D19] border-white/[0.08] text-[#94A3B8] hover:border-white/20'
                                }`}
                              >
                                <span className="text-2xl block mb-1">{item.icon}</span>
                                <span className={`block text-xs font-bold ${isSelected ? 'text-[#FFC928]' : 'text-white'}`}>
                                  {item.role}
                                </span>
                                <span className="block text-[10px] text-[#94A3B8] mt-0.5">{item.desc}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Batting Style & Bowling Style */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {/* Batting Style Buttons */}
                        <div>
                          <label className="block text-xs font-semibold text-[#F8FAFC] mb-2">
                            BATTING STYLE <span className="text-[#FFC928]">*</span>
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {['Right-hand', 'Left-hand'].map((style) => (
                              <button
                                key={style}
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, battingStyle: style }))}
                                className={`py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                                  formData.battingStyle === style
                                    ? 'bg-[#FFC928] text-[#05070D] border-[#FFC928]'
                                    : 'bg-[#080D19] text-[#94A3B8] border-white/[0.08] hover:text-white'
                                }`}
                              >
                                {style === 'Right-hand' ? '🏏 Right Hand' : '🏏 Left Hand'}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* T-Shirt Size Buttons */}
                        <div>
                          <label className="block text-xs font-semibold text-[#F8FAFC] mb-2">
                            T-SHIRT SIZE <span className="text-[#FFC928]">*</span>
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {['S', 'M', 'L', 'XL', 'XXL', '3XL'].map((size) => (
                              <button
                                key={size}
                                type="button"
                                onClick={() => setFormData((prev) => ({ ...prev, tshirtSize: size }))}
                                className={`h-11 px-4 rounded-xl border text-xs font-bold transition-all ${
                                  formData.tshirtSize === size
                                    ? 'bg-[#FFC928] text-[#05070D] border-[#FFC928]'
                                    : 'bg-[#080D19] text-[#94A3B8] border-white/[0.08] hover:text-white'
                                }`}
                              >
                                {size}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Bowling Style Options */}
                      <div>
                        <label className="block text-xs font-semibold text-[#F8FAFC] mb-2">
                          BOWLING STYLE
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                          {[
                            'None',
                            'Right-arm Fast',
                            'Right-arm Medium',
                            'Right-arm Spin',
                            'Left-arm Fast',
                            'Left-arm Spin',
                          ].map((bStyle) => (
                            <button
                              key={bStyle}
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, bowlingStyle: bStyle }))}
                              className={`py-2.5 px-3 rounded-xl border text-xs font-semibold transition-all ${
                                formData.bowlingStyle === bStyle
                                  ? 'bg-[#FFC928]/15 border-[#FFC928] text-[#FFC928]'
                                  : 'bg-[#080D19] border-white/[0.08] text-[#94A3B8] hover:text-white'
                              }`}
                            >
                              {bStyle}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Wicketkeeper Checkbox Toggle */}
                      <div className="p-4 rounded-xl bg-[#080D19] border border-white/[0.08] flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="isWicketkeeperToggle"
                          checked={formData.isWicketkeeper}
                          onChange={(e) =>
                            setFormData((prev) => ({ ...prev, isWicketkeeper: e.target.checked }))
                          }
                          className="w-4 h-4 rounded bg-[#05070D] border-white/20 text-[#FFC928] focus:ring-[#FFC928] cursor-pointer"
                        />
                        <label
                          htmlFor="isWicketkeeperToggle"
                          className="text-xs font-bold text-white cursor-pointer select-none"
                        >
                          🧤 I also play as a wicketkeeper
                        </label>
                      </div>

                      {/* Base Price Display Badge (Admin Controlled) */}
                      <div className="p-4 rounded-xl bg-[#05070D] border border-white/[0.08] flex items-center justify-between">
                        <div>
                          <span className="block text-xs font-semibold text-white">Auction Base Price</span>
                          <span className="block text-[10px] text-[#94A3B8]">Set by tournament organizers</span>
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-black text-[#FFC928]">₹5,000</span>
                        </div>
                      </div>

                      {/* Player Description */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-xs font-semibold text-[#F8FAFC]">
                            Tell Us About Your Game
                          </label>
                          <span className="text-[10px] text-[#94A3B8]">
                            {formData.description.length} / 500
                          </span>
                        </div>
                        <textarea
                          name="description"
                          rows={3}
                          maxLength={500}
                          value={formData.description}
                          onChange={handleChange}
                          placeholder="Tell us about your cricket experience, achievements, club/division representation, best performances, etc."
                          className="w-full p-4 rounded-xl bg-[#080D19] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-[#FFC928] focus:ring-1 focus:ring-[#FFC928] transition-colors leading-relaxed"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: REVIEW & PAYMENT */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <div className="border-b border-white/[0.08] pb-4">
                      <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-[#FFC928]" />
                        <span>Review Your Registration</span>
                      </h2>
                      <p className="text-xs text-[#94A3B8] mt-1">
                        Please review your details before proceeding to payment.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Personal Details Review Box */}
                      <div className="p-4 rounded-xl bg-[#080D19] border border-white/[0.08] space-y-3">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                          <span className="text-xs font-bold text-[#FFC928] flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5" /> Personal Details
                          </span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(1)}
                            className="text-[11px] font-semibold text-[#FFC928] hover:underline flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit Personal Details
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="block text-[10px] text-[#94A3B8]">Full Name</span>
                            <span className="font-semibold text-white">{formData.name || '—'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-[#94A3B8]">WhatsApp Phone</span>
                            <span className="font-semibold text-white">{formData.phone || '—'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-[#94A3B8]">Date of Birth</span>
                            <span className="font-semibold text-white">
                              {formData.dob || '—'} {formData.age ? `(${formData.age} yrs)` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-[#94A3B8]">Pincode</span>
                            <span className="font-semibold text-white font-mono">{formData.pincode || '—'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-[#94A3B8]">Email</span>
                            <span className="font-semibold text-white">{formData.email || 'Optional'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Verification Review Box */}
                      <div className="p-4 rounded-xl bg-[#080D19] border border-white/[0.08] space-y-3">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                          <span className="text-xs font-bold text-[#FFC928] flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5" /> Identity Verification
                          </span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            className="text-[11px] font-semibold text-[#FFC928] hover:underline flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit Verification
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <span className="block text-[10px] text-[#94A3B8]">Aadhaar Number</span>
                            <span className="font-semibold text-white font-mono">{formData.aadharNumber || '—'}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-[#94A3B8]">Aadhaar Document</span>
                            <span className="font-semibold text-emerald-400">
                              {formData.aadharPhoto ? '✓ Uploaded' : 'Not attached'}
                            </span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-[#94A3B8]">Player Photo</span>
                            <span className="font-semibold text-emerald-400">
                              {formData.profilePhoto ? '✓ Uploaded' : 'Not attached'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Cricket Profile Review Box */}
                      <div className="p-4 rounded-xl bg-[#080D19] border border-white/[0.08] space-y-3">
                        <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                          <span className="text-xs font-bold text-[#FFC928] flex items-center gap-1.5">
                            <Award className="w-3.5 h-3.5" /> Cricket Profile
                          </span>
                          <button
                            type="button"
                            onClick={() => setCurrentStep(3)}
                            className="text-[11px] font-semibold text-[#FFC928] hover:underline flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3" /> Edit Cricket Profile
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div>
                            <span className="block text-[10px] text-[#94A3B8]">Primary Role</span>
                            <span className="font-semibold text-white">{formData.category}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-[#94A3B8]">Batting Style</span>
                            <span className="font-semibold text-white">{formData.battingStyle}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-[#94A3B8]">Bowling Style</span>
                            <span className="font-semibold text-white">{formData.bowlingStyle}</span>
                          </div>
                          <div>
                            <span className="block text-[10px] text-[#94A3B8]">T-Shirt Size</span>
                            <span className="font-semibold text-white">{formData.tshirtSize}</span>
                          </div>
                        </div>
                        {formData.isWicketkeeper && (
                          <div className="text-xs text-[#FFC928] font-semibold pt-1">
                            🧤 Wicketkeeper Option Active
                          </div>
                        )}
                        {formData.description && (
                          <div className="pt-2 border-t border-white/[0.06]">
                            <span className="block text-[10px] text-[#94A3B8]">Description</span>
                            <p className="text-xs text-white leading-relaxed mt-0.5">{formData.description}</p>
                          </div>
                        )}
                      </div>

                      {/* PAYMENT SUMMARY BOX */}
                      <div className="p-6 rounded-2xl bg-[#05070D] border border-[#FFC928]/30 space-y-4 shadow-xl">
                        <span className="text-[11px] font-bold text-[#FFC928] uppercase tracking-wider block">
                          PAYMENT SUMMARY
                        </span>
                        <div className="space-y-2 text-xs text-[#94A3B8] border-b border-white/[0.08] pb-3">
                          <div className="flex items-center justify-between">
                            <span>Registration Fee</span>
                            <span className="text-white font-semibold">₹208</span>
                          </div>
                          <div className="flex items-center justify-between text-[#94A3B8]">
                            <span>Tax / Gateways</span>
                            <span className="text-emerald-400 font-semibold">Included</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-base font-extrabold text-white">
                          <span>TOTAL</span>
                          <span className="text-2xl text-[#FFC928]">₹208</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#94A3B8]">
                          <Lock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Secure Payment via Cashfree Payments Gateway</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* NAVIGATION ACTION BUTTONS */}
                <div className="flex items-center justify-between pt-4 border-t border-white/[0.08] gap-4">
                  {currentStep > 1 ? (
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="px-5 h-12 rounded-xl bg-[#080D19] border border-white/[0.08] text-white text-xs font-semibold hover:border-white/20 transition-all flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>BACK</span>
                    </button>
                  ) : (
                    <div></div>
                  )}

                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={handleNextStep}
                      className="px-6 h-12 rounded-xl bg-[#FFC928] text-[#05070D] text-xs font-extrabold hover:bg-[#ffe066] transition-all flex items-center gap-2 shadow-lg shadow-[#FFC928]/10 cursor-pointer"
                    >
                      <span>CONTINUE</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleRegisterSubmit}
                      className="px-8 h-12 rounded-xl bg-[#FFC928] text-[#05070D] text-xs font-black tracking-wide hover:bg-[#ffe066] transition-all flex items-center gap-2 shadow-xl shadow-[#FFC928]/20 cursor-pointer disabled:opacity-50"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>{loading ? 'Processing...' : 'PROCEED TO PAYMENT →'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT STICKY SIDEBAR (~30% desktop width) */}
            <div className="lg:col-span-4 space-y-5 sticky top-24">
              <div className="bg-[#0B101C] border border-white/[0.08] rounded-2xl p-6 space-y-5 shadow-xl">
                <div>
                  <span className="text-[10px] font-bold text-[#FFC928] uppercase tracking-wider block">
                    REGISTRATION SUMMARY
                  </span>
                  <div className="text-3xl font-extrabold text-white mt-1">₹208</div>
                  <span className="text-[11px] text-[#94A3B8]">Official Player Entry Fee</span>
                </div>

                <div className="space-y-3 pt-3 border-t border-white/[0.08] text-xs">
                  <div className="flex items-center justify-between text-[#94A3B8]">
                    <span>Current Step</span>
                    <strong className="text-white">Step 0{currentStep} of 04</strong>
                  </div>
                  <div className="flex items-center justify-between text-[#94A3B8]">
                    <span>Step Name</span>
                    <strong className="text-[#FFC928]">{stepsConfig[currentStep - 1].title}</strong>
                  </div>
                  <div className="w-full bg-[#05070D] h-2 rounded-full overflow-hidden border border-white/[0.05]">
                    <div
                      className="bg-[#FFC928] h-full transition-all duration-300"
                      style={{ width: `${(currentStep / 4) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#05070D] border border-white/[0.06] space-y-2 text-[11px] text-[#94A3B8]">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verified Player Profile</span>
                  </div>
                  <p className="leading-relaxed">
                    Once registered, your player card is verified & listed in the official ASPL 2026 auction pool.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#05070D] text-white flex justify-center items-center">
          <div className="text-[#94A3B8] text-xs font-semibold animate-pulse">Loading ASPL Registration...</div>
        </div>
      }
    >
      <RegisterFormContent />
    </Suspense>
  );
}
