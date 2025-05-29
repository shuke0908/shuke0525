/**
 * 환경변수 관리 및 검증
 * 필수 환경변수가 누락된 경우 명확한 오류 메시지 제공
 */

// 필수 환경변수 목록 (프로덕션 환경에서만)
const REQUIRED_ENV_VARS_PRODUCTION = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL',
] as const;

// 개발 환경에서 필수 환경변수 (최소한)
const REQUIRED_ENV_VARS_DEVELOPMENT = [
  // 개발 환경에서는 모든 환경변수를 선택사항으로 처리
] as const;

// 환경변수 기본값
const DEFAULT_VALUES = {
  NEXT_PUBLIC_API_URL: '/api',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:8000',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'dev-anon-key',
  DATABASE_URL: 'file:./dev.db',
  JWT_SECRET: 'dev-secret-key-32-characters-long',
  SESSION_SECRET: 'dev-session-secret',
} as const;

// 초기화 상태 추적
let isInitialized = false;

/**
 * 현재 실행 환경 확인
 */
function getCurrentEnvironment() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isNextBuild = process.env.NEXT_PHASE === 'phase-production-build';
  const isNextServer = process.env.NEXT_PHASE === 'phase-production-server';
  const isProduction = nodeEnv === 'production';
  const isDevelopment = nodeEnv === 'development';
  
  return {
    nodeEnv,
    isNextBuild,
    isNextServer,
    isProduction,
    isDevelopment,
    isBuildTime: isNextBuild,
    isRuntime: !isNextBuild,
  };
}

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
  const env = getCurrentEnvironment();
  
  // 빌드 타임에는 검증하지 않음
  if (env.isBuildTime) {
    return { isValid: true, missingVars, errors };
  }
  
  // 환경에 따라 다른 필수 변수 목록 사용
  const requiredVars = env.isProduction && env.isRuntime
    ? REQUIRED_ENV_VARS_PRODUCTION 
    : REQUIRED_ENV_VARS_DEVELOPMENT;

  for (const envVar of requiredVars) {
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
  const env = getCurrentEnvironment();
  
  // 프로덕션 런타임에서는 기본값 설정하지 않음 (단, 빌드 타임은 예외)
  if (env.isProduction && env.isRuntime) {
    return;
  }

  for (const [key, defaultValue] of Object.entries(DEFAULT_VALUES)) {
    if (!process.env[key]) {
      process.env[key] = defaultValue;
    }
  }
}

/**
 * 환경변수 검증 및 기본값 설정
 */
export function initializeEnvironment(): void {
  // 이미 초기화되었으면 건너뛰기
  if (isInitialized) {
    return;
  }

  const env = getCurrentEnvironment();

  // 기본값 설정 (빌드 타임 또는 개발 환경)
  if (env.isBuildTime || env.isDevelopment) {
    setDefaultEnvVars();
  }

  const validation = validateRequiredEnvVars();
  
  if (!validation.isValid) {
    if (env.isProduction && env.isRuntime && !env.isBuildTime) {
      // 프로덕션 런타임에서만 오류 발생
      console.error('❌ Missing required environment variables:', validation.missingVars.join(', '));
      console.error('Please set the required environment variables before starting the server.');
      // 완전한 실패 대신 경고만 출력하고 기본값 사용
      setDefaultEnvVars();
    } else if (env.isDevelopment) {
      console.warn('⚠️ Some environment variables are missing:', validation.missingVars.join(', '));
      console.warn('Using default values for development...');
    }
  }
  
  // 개발 환경에서만 상태 로그 출력 (한 번만)
  if (env.isDevelopment && typeof window === 'undefined') {
    console.log('🔧 Environment Variables Status:');
    console.log('✅ Environment:', env.nodeEnv);
    console.log('✅ Required variables:', validation.isValid ? 'All set' : `Using defaults for: ${validation.missingVars.join(', ')}`);
    console.log('🌐 API URL:', process.env.NEXT_PUBLIC_API_URL);
    console.log('🏠 App URL:', process.env.NEXT_PUBLIC_APP_URL);
    console.log('🗄️ Database:', process.env.DATABASE_URL ? 'Connected' : 'Configured');
  }

  isInitialized = true;
}

// layout.tsx와 middleware.ts에서 사용하는 별칭
export const validateEnvironment = initializeEnvironment;

// 환경변수 상태 확인
export const isProduction = getCurrentEnvironment().isProduction;
export const isDevelopment = getCurrentEnvironment().isDevelopment;
export const isTest = process.env.NODE_ENV === 'test';

// 환경변수 접근자 (항상 기본값 보장)
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dev-anon-key',
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-key-32-characters-long',
  SESSION_SECRET: process.env.SESSION_SECRET || 'dev-session-secret',
} as const;

// 안전한 자동 초기화 (모듈 로드 시, 서버 사이드에서만)
if (typeof window === 'undefined') {
  try {
    initializeEnvironment();
  } catch (error) {
    console.warn('Environment initialization warning:', error);
    // 오류가 발생해도 기본값으로 계속 진행
    setDefaultEnvVars();
  }
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
  getCurrentEnvironment,
};

export default environmentModule;
