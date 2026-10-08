export const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    return 'http://localhost:4000';
  }
  return 'https://aspl-cricket-web.onrender.com';
};

export const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'http://localhost:4000'
  : (process.env.NEXT_PUBLIC_API_URL || 'https://aspl-cricket-web.onrender.com');

/**
 * Standard Cashfree Onboarding Business Model Descriptions & Disclaimers
 */
export const ASPL_BUSINESS_DESCRIPTION =
  'ASPL 2026 is an offline cricket tournament registration and tournament management platform. Players pay a one-time ₹208 registration fee to register for participation in the tournament. Registered players are verified by the tournament organizers. Authorized team owners select registered players through an organizer-managed live player auction using non-monetary ASPL Credits allocated by the tournament organizer. The credits have no cash value and cannot be purchased, transferred, withdrawn, redeemed, or exchanged for money. No betting, gambling, wagering, or cash payouts based on match or auction outcomes are involved.';

export const ASPL_CREDITS_DISCLAIMER =
  'ASPL Credits are non-monetary tournament credits allocated by ASPL for player selection during the ASPL 2026 auction. They have no cash value and cannot be purchased, transferred, withdrawn, refunded, redeemed, or exchanged for money. Credits are used exclusively for tournament squad selection.';

export const ASPL_PAYMENT_DESCRIPTION = 'ASPL 2026 Player Registration Fee';

