import dotenv from 'dotenv';
dotenv.config();

export const CONFIG = {
  PORT: process.env.PORT || 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_SECRET: process.env.JWT_SECRET || 'mini-ipl-super-secret-jwt-key-2026-production-ready',
  APP_URL: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://idyllic-youtiao-34126e.netlify.app',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://aspl-cricket-web.onrender.com',

  TOURNAMENT_NAME: process.env.TOURNAMENT_NAME || 'Mini IPL Cricket Tournament 2026',
  REGISTRATION_FEE: Number(process.env.REGISTRATION_FEE) || 208,
  INITIAL_TEAM_PURSE: Number(process.env.INITIAL_TEAM_PURSE) || 1000000,
  MIN_BID_INCREMENT: Number(process.env.MIN_BID_INCREMENT) || 500,
  MAX_SQUAD_SIZE: Number(process.env.MAX_SQUAD_SIZE) || 15,
  AUCTION_TIMER_SECONDS: Number(process.env.AUCTION_TIMER_SECONDS) || 30,
  BID_TIMER_RESET_SECONDS: Number(process.env.BID_TIMER_RESET_SECONDS) || 60,

  PAYMENT_PROVIDER: process.env.PAYMENT_PROVIDER || 'CASHFREE',
  CASHFREE_APP_ID: process.env.CASHFREE_APP_ID || 'TEST_CASHFREE_APP_ID_IPL2026',
  CASHFREE_SECRET_KEY: process.env.CASHFREE_SECRET_KEY || 'TEST_CASHFREE_SECRET_KEY_IPL2026',
  CASHFREE_ENVIRONMENT: process.env.CASHFREE_ENVIRONMENT || process.env.CASHFREE_ENV || 'sandbox',
  CASHFREE_WEBHOOK_SECRET: process.env.CASHFREE_WEBHOOK_SECRET || process.env.CASHFREE_SECRET_KEY || 'TEST_CASHFREE_SECRET_KEY_IPL2026',

  PHONEPE_MERCHANT_ID: process.env.PHONEPE_MERCHANT_ID || 'PGTESTPAYUAT',
  PHONEPE_SALT_KEY: process.env.PHONEPE_SALT_KEY || '099eb0cd-02fa-4e2d-73a6-5ce62f091983',
  PHONEPE_SALT_INDEX: process.env.PHONEPE_SALT_INDEX || '1',
  PHONEPE_ENVIRONMENT: process.env.PHONEPE_ENVIRONMENT || 'sandbox',

  WHATSAPP_PROVIDER: process.env.WHATSAPP_PROVIDER || 'META_CLOUD',
  WHATSAPP_BUSINESS_NUMBER: process.env.WHATSAPP_BUSINESS_NUMBER || '8056687724',
  WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  WHATSAPP_API_TOKEN: process.env.WHATSAPP_API_TOKEN || '',
  WHATSAPP_TEMPLATE_NAME: process.env.WHATSAPP_TEMPLATE_NAME || 'player_registration_success',

  SUPABASE_URL: process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_STORAGE_BUCKET_PUBLIC: process.env.SUPABASE_STORAGE_BUCKET_PUBLIC || 'player-photos',
  SUPABASE_STORAGE_BUCKET_PRIVATE: process.env.SUPABASE_STORAGE_BUCKET_PRIVATE || 'player-documents',
};
