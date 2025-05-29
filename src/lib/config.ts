// 애플리케이션 환경 변수와 설정을 중앙화하는 파일

// 환경변수 타입 정의
interface EnvironmentConfig {
  // 기본 설정
  NODE_ENV: 'development' | 'production' | 'test';
  
  // API 설정
  API_BASE_URL: string;
  API_TIMEOUT: number;
  
  // Supabase 설정
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  
  // 데이터베이스 설정
  DATABASE_URL: string;
  
  // JWT 설정
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // 세션 설정
  SESSION_SECRET: string;
  SESSION_MAX_AGE: number;
  
  // 기타 설정
  ENABLE_LOGGING: boolean;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

// 기본 설정값
const defaultConfig: EnvironmentConfig = {
  NODE_ENV: 'development',
  API_BASE_URL: '/api',
  API_TIMEOUT: 30000,
  SUPABASE_URL: 'https://gfzmwtvnktvvckzbybdl.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdmem13dHZua3R2dmNremJ5YmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc5MDI0NzQsImV4cCI6MjA1MzQ3ODQ3NH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8',
  DATABASE_URL: 'postgresql://postgres:JM3HsB6FrpoCeXKh@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  JWT_SECRET: 'your-super-secret-jwt-key-here',
  JWT_EXPIRES_IN: '7d',
  SESSION_SECRET: 'your-session-secret-key',
  SESSION_MAX_AGE: 7 * 24 * 60 * 60 * 1000, // 7일
  ENABLE_LOGGING: true,
  LOG_LEVEL: 'info',
};

// 환경변수 검증 및 기본값 설정
function validateAndParseEnv(): EnvironmentConfig {
  // 클라이언트 사이드에서는 기본값만 사용
  if (typeof window !== 'undefined') {
    return defaultConfig;
  }

  // 서버 사이드에서만 process.env 접근
  const env = process?.env || {};
  
  return {
    NODE_ENV: (env.NODE_ENV as any) || defaultConfig.NODE_ENV,
    API_BASE_URL: env.NEXT_PUBLIC_API_BASE_URL || defaultConfig.API_BASE_URL,
    API_TIMEOUT: parseInt(env.API_TIMEOUT || '30000'),
    SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL || defaultConfig.SUPABASE_URL,
    SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY || defaultConfig.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: env.DATABASE_URL || defaultConfig.DATABASE_URL,
    JWT_SECRET: env.JWT_SECRET || defaultConfig.JWT_SECRET,
    JWT_EXPIRES_IN: env.JWT_EXPIRES_IN || defaultConfig.JWT_EXPIRES_IN,
    SESSION_SECRET: env.SESSION_SECRET || defaultConfig.SESSION_SECRET,
    SESSION_MAX_AGE: parseInt(env.SESSION_MAX_AGE || String(defaultConfig.SESSION_MAX_AGE)),
    ENABLE_LOGGING: env.ENABLE_LOGGING === 'true' || defaultConfig.ENABLE_LOGGING,
    LOG_LEVEL: (env.LOG_LEVEL as any) || defaultConfig.LOG_LEVEL,
  };
}

// 환경변수 검증 및 로딩
let config: EnvironmentConfig;

try {
  config = validateAndParseEnv();
  
  // 서버 사이드에서만 환경변수 상태 로깅
  if (typeof window === 'undefined') {
    console.log('🚨 Environment Variable Validation Failed:');
    
    const requiredVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
    const missingVars = requiredVars.filter(varName => {
      const value = process?.env?.[varName];
      return !value || value.trim() === '';
    });
    
    if (missingVars.length > 0) {
      missingVars.forEach(varName => {
        console.log(`❌ ${varName} is required but not set`);
      });
      console.log('⚠️ Running with missing environment variables');
      console.log('📝 Please create a .env.local file with the required variables');
    }
    
    if (!process?.env?.DATABASE_URL) {
      console.log('⚠️ DATABASE_URL not set, using default:');
    }
    
    console.log('🔧 Environment Variables Status:');
    console.log(`✅ Required variables: Missing: ${missingVars.join(', ')}`);
    console.log(`🌐 API URL: ${config.API_BASE_URL}`);
    console.log(`🏠 App URL: http://localhost:3000`);
    console.log(`🗄️ Database: ${config.DATABASE_URL ? 'Configured' : 'Not configured'}`);
  }
} catch (error) {
  console.error('❌ Failed to load environment configuration:', error);
  config = defaultConfig;
}

// 설정 내보내기
export default config;

// 개별 설정값 내보내기 (편의성을 위해)
export const {
  NODE_ENV,
  API_BASE_URL,
  API_TIMEOUT,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  DATABASE_URL,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  SESSION_SECRET,
  SESSION_MAX_AGE,
  ENABLE_LOGGING,
  LOG_LEVEL,
} = config;

// 환경별 유틸리티 함수
export const isDevelopment = NODE_ENV === 'development';
export const isProduction = NODE_ENV === 'production';
export const isTest = NODE_ENV === 'test';

// API URL 생성 헬퍼
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'http://localhost:3000';
  return `${baseUrl}${API_BASE_URL}${endpoint}`;
};

// 설정 검증 함수
export const validateConfig = (): boolean => {
  const requiredFields: (keyof EnvironmentConfig)[] = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'JWT_SECRET',
    'SESSION_SECRET'
  ];
  
  return requiredFields.every(field => {
    const value = config[field];
    return value && String(value).trim() !== '';
  });
};

// API 엔드포인트 설정
export const API_ENDPOINTS = {
  // 인증
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    VERIFY_EMAIL: '/api/auth/verify-email',
    RESET_PASSWORD: '/api/auth/reset-password',
  },
  
  // 사용자
  USER: {
    PROFILE: '/api/user/profile',
    WALLETS: '/api/user/wallets',
    TRANSACTIONS: '/api/user/transactions',
    ORDERS: '/api/user/orders',
    TRADES: '/api/user/trades',
    KYC: '/api/user/kyc',
    SETTINGS: '/api/user/settings',
  },
  
  // 거래
  TRADING: {
    PAIRS: '/api/trading/pairs',
    ORDERS: '/api/trading/orders',
    TRADES: '/api/trading/trades',
    ORDERBOOK: '/api/trading/orderbook',
    TICKER: '/api/trading/ticker',
    KLINES: '/api/trading/klines',
    QUICK_TRADE: '/api/trading/quick-trade',
    FLASH_TRADE: '/api/trading/flash-trade',
  },
  
  // 관리자
  ADMIN: {
    USERS: '/api/admin/users',
    DEPOSITS: '/api/admin/deposits',
    WITHDRAWALS: '/api/admin/withdrawals',
    KYC: '/api/admin/kyc',
    SUPPORT_TICKETS: '/api/admin/support-tickets',
    ANALYTICS: '/api/admin/analytics',
    SETTINGS: '/api/admin/settings',
  },
  
  // 외부 API
  EXTERNAL: {
    COINMARKETCAP: 'https://pro-api.coinmarketcap.com/v1',
    BINANCE: 'https://api.binance.com/api/v3',
    COINGECKO: 'https://api.coingecko.com/api/v3',
  },
} as const;

// 거래 쌍 설정
export const TRADING_PAIRS = [
  { symbol: 'BTC/USDT', base: 'BTC', quote: 'USDT', minOrderSize: 0.00001 },
  { symbol: 'ETH/USDT', base: 'ETH', quote: 'USDT', minOrderSize: 0.0001 },
  { symbol: 'BNB/USDT', base: 'BNB', quote: 'USDT', minOrderSize: 0.001 },
  { symbol: 'ADA/USDT', base: 'ADA', quote: 'USDT', minOrderSize: 0.1 },
  { symbol: 'SOL/USDT', base: 'SOL', quote: 'USDT', minOrderSize: 0.001 },
  { symbol: 'DOT/USDT', base: 'DOT', quote: 'USDT', minOrderSize: 0.01 },
  { symbol: 'MATIC/USDT', base: 'MATIC', quote: 'USDT', minOrderSize: 0.1 },
  { symbol: 'AVAX/USDT', base: 'AVAX', quote: 'USDT', minOrderSize: 0.01 },
] as const;

// 지원 통화 설정
export const SUPPORTED_CURRENCIES = [
  { code: 'BTC', name: 'Bitcoin', decimals: 8, type: 'crypto' },
  { code: 'ETH', name: 'Ethereum', decimals: 8, type: 'crypto' },
  { code: 'USDT', name: 'Tether', decimals: 6, type: 'stablecoin' },
  { code: 'USDC', name: 'USD Coin', decimals: 6, type: 'stablecoin' },
  { code: 'BNB', name: 'Binance Coin', decimals: 8, type: 'crypto' },
  { code: 'ADA', name: 'Cardano', decimals: 6, type: 'crypto' },
  { code: 'SOL', name: 'Solana', decimals: 9, type: 'crypto' },
  { code: 'DOT', name: 'Polkadot', decimals: 10, type: 'crypto' },
] as const;

// 수수료 설정
export const FEE_STRUCTURE = {
  TRADING: {
    MAKER: 0.001, // 0.1%
    TAKER: 0.001, // 0.1%
    VIP_MAKER: 0.0005, // 0.05%
    VIP_TAKER: 0.0005, // 0.05%
  },
  WITHDRAWAL: {
    BTC: 0.0005,
    ETH: 0.005,
    USDT: 1.0,
    USDC: 1.0,
    BNB: 0.001,
    ADA: 1.0,
    SOL: 0.01,
    DOT: 0.1,
  },
  DEPOSIT: {
    CRYPTO: 0, // 무료
    FIAT: 0.01, // 1%
  },
} as const;

// 제한 설정
export const LIMITS = {
  ORDER: {
    MIN_AMOUNT: 10, // USDT
    MAX_AMOUNT: 1000000, // USDT
    MAX_ORDERS_PER_USER: 100,
  },
  WITHDRAWAL: {
    DAILY_LIMIT: 100000, // USDT
    MONTHLY_LIMIT: 1000000, // USDT
    MIN_AMOUNT: 10, // USDT
  },
  DEPOSIT: {
    MIN_AMOUNT: 1, // USDT
    MAX_AMOUNT: 1000000, // USDT
  },
  KYC: {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  },
} as const;

// 시간 설정
export const TIME_CONSTANTS = {
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
  MONTH: 30 * 24 * 60 * 60 * 1000,
} as const;

// 차트 설정
export const CHART_CONFIG = {
  INTERVALS: ['1m', '5m', '15m', '30m', '1h', '4h', '1d', '1w', '1M'] as const,
  DEFAULT_INTERVAL: '1h' as const,
  MAX_CANDLES: 1000,
  COLORS: {
    UP: '#00C896',
    DOWN: '#FF6B6B',
    VOLUME: '#8884d8',
    MA: '#ffc658',
  },
} as const;

// 알림 설정
export const NOTIFICATION_CONFIG = {
  TYPES: {
    ORDER_FILLED: 'order_filled',
    DEPOSIT_CONFIRMED: 'deposit_confirmed',
    WITHDRAWAL_PROCESSED: 'withdrawal_processed',
    PRICE_ALERT: 'price_alert',
    SECURITY_ALERT: 'security_alert',
    KYC_UPDATE: 'kyc_update',
  },
  CHANNELS: {
    EMAIL: 'email',
    SMS: 'sms',
    PUSH: 'push',
    IN_APP: 'in_app',
  },
} as const;

// 로그 레벨 설정
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
} as const;

// 보안 설정
export const SECURITY_CONFIG = {
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SYMBOLS: true,
  },
  SESSION: {
    SECURE: isProduction,
    HTTP_ONLY: true,
    SAME_SITE: 'strict' as const,
  },
  RATE_LIMITING: {
    ENABLED: !isDevelopment,
    WINDOW_MS: 15 * 60 * 1000, // 15분
    MAX_REQUESTS: 100,
  },
} as const;

// Rate limiting 상수 내보내기
export const RATE_LIMIT_WINDOW = SECURITY_CONFIG.RATE_LIMITING.WINDOW_MS;
export const RATE_LIMIT_MAX_REQUESTS = SECURITY_CONFIG.RATE_LIMITING.MAX_REQUESTS;

// 환경별 기능 플래그
export const FEATURE_FLAGS = {
  FLASH_TRADING: isProduction || isDevelopment,
  QUANT_AI: isProduction || isDevelopment,
  SOCIAL_TRADING: false,
  MARGIN_TRADING: false,
  FUTURES_TRADING: false,
  OPTIONS_TRADING: false,
  STAKING: false,
  LENDING: false,
} as const;

// 애플리케이션 정보
export const APP_INFO = {
  name: 'CryptoTrader',
  version: '1.0.0',
  description: 'Advanced Cryptocurrency Trading Platform',
  author: 'CryptoTrader Team',
  website: 'https://cryptotrader.com',
  support: 'support@cryptotrader.com',
  keywords: ['cryptocurrency', 'trading', 'blockchain', 'bitcoin', 'ethereum'],
} as const;
