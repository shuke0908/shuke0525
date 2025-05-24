/**
 * 환경변수 관리 및 검증
 * 필수 환경변수가 누락된 경우 명확한 오류 메시지 제공
 */

// 필수 환경변수 목록
const REQUIRED_ENV_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const;

// 환경변수 기본값
const DEFAULT_VALUES = {
  NEXT_PUBLIC_API_URL: '/api',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  DATABASE_URL: '',
  JWT_SECRET: 'dev-secret-key',
  SESSION_SECRET: 'dev-session-secret',
} as const;

/**
 * 필수 환경변수 검증
 */
export function validateRequiredEnvVars(): {
  isValid: boolean;
  missingVars: string[];
  errors: string[];
} {
  const missingVars: string[] = [];
  const errors: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missingVars.push(envVar);
      errors.push(`❌ ${envVar} is required but not set`);
    }
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    errors,
  };
}

/**
 * 환경변수 기본값 설정
 */
export function setDefaultEnvVars(): void {
  const isProductionEnv = process.env.NODE_ENV === 'production';
  
  // 프로덕션 환경에서는 기본값 설정하지 않음
  if (isProductionEnv) {
    return;
  }

  for (const [key, defaultValue] of Object.entries(DEFAULT_VALUES)) {
    if (!process.env[key]) {
      console.warn(`⚠️ ${key} not set, using default: ${defaultValue}`);
      process.env[key] = defaultValue;
    }
  }
}

/**
 * 환경변수 검증 및 기본값 설정
 */
export function initializeEnvironment(): void {
  const validation = validateRequiredEnvVars();
  
  if (!validation.isValid) {
    console.error('🚨 Environment Variable Validation Failed:');
    validation.errors.forEach(error => console.error(error));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Missing required environment variables: ${validation.missingVars.join(', ')}`);
    } else {
      console.warn('⚠️ Running in development mode with missing environment variables');
      console.warn('📝 Please create a .env.local file with the required variables');
    }
  }

  // 개발 환경에서 기본값 설정
  setDefaultEnvVars();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 Environment Variables Status:');
    console.log('✅ Required variables:', validation.isValid ? 'All set' : `Missing: ${validation.missingVars.join(', ')}`);
    console.log('🌐 API URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('🏠 App URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('🗄️ Database:', process.env.DATABASE_URL ? 'Connected' : 'Not configured');
  }
}

// layout.tsx와 middleware.ts에서 사용하는 별칭
export const validateEnvironment = initializeEnvironment;

// 환경변수 상태 확인
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isTest = process.env.NODE_ENV === 'test';

// 환경변수 접근자
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key',
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-session-secret',
} as const;

// 자동 초기화 (모듈 로드 시)
if (typeof window === 'undefined') {
  // 서버 사이드에서만 실행
  initializeEnvironment();
}

const environmentModule = {
  isProduction,
  isDevelopment,
  isTest,
  env,
  validateRequiredEnvVars,
  setDefaultEnvVars,
  initializeEnvironment,
  validateEnvironment,
};

export default environmentModule;
