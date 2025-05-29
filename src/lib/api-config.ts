/**
 * API 설정 관리
 * 환경변수 기반으로 API URL과 설정을 동적으로 관리합니다.
 */

// API Configuration for the new modular client
export interface ApiConfig {
  baseURL: string;
  timeout: number;
  enableErrorToast: boolean;
  enableSuccessToast: boolean;
  headers: Record<string, string>;
}

// Environment-based configuration
const configs: Record<string, ApiConfig> = {
  development: {
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    timeout: 30000,
    enableErrorToast: true,
    enableSuccessToast: true,
    headers: {
      'Content-Type': 'application/json',
    },
  },
  production: {
    baseURL: process.env.NEXT_PUBLIC_API_URL || '',
    timeout: 15000,
    enableErrorToast: true,
    enableSuccessToast: false,
    headers: {
      'Content-Type': 'application/json',
    },
  },
  test: {
    baseURL: 'http://localhost:3000',
    timeout: 5000,
    enableErrorToast: false,
    enableSuccessToast: false,
    headers: {
      'Content-Type': 'application/json',
    },
  },
};

export const getApiConfig = (env: string = process.env.NODE_ENV): ApiConfig => {
  const config = configs[env as keyof typeof configs];
  if (!config) {
    console.warn(`No API config found for environment: ${env}, falling back to development`);
    return configs.development;
  }
  return config;
};

export function getApiBaseUrl(): string {
  return getApiConfig().baseURL;
}

export function logApiConfig(): void {
  if (process.env.NODE_ENV === 'development') {
    const config = getApiConfig();
    console.log('[API Config]', {
      environment: process.env.NODE_ENV,
      baseURL: config.baseURL,
      timeout: config.timeout,
    });
  }
}

// ===== API 기본 설정 (레거시 호환성) =====
export const API_CONFIG = {
  // 기본 URL (환경에 따라 동적 설정)
  get baseURL() {
    return getApiBaseUrl();
  },
  
  // 타임아웃 설정
  timeout: 30000,
  
  // 기본 헤더
  headers: {
    'Content-Type': 'application/json',
  },
  
  // 인증 설정
  auth: {
    tokenKey: 'auth_token',
    csrfTokenKey: 'csrf-token',
    includeCredentials: true,
  },
  
  // 재시도 설정
  retry: {
    attempts: 1,
    delay: 1000,
  },
  
  // 개발 환경 설정
  development: {
    enableLogging: true,
    enableErrorToast: true,
    enableSuccessToast: false,
  },
  
  // 프로덕션 환경 설정
  production: {
    enableLogging: false,
    enableErrorToast: true,
    enableSuccessToast: false,
  },
} as const;

// ===== 환경변수 검증 =====
export function validateApiConfig(): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const baseUrl = getApiBaseUrl();
  
  // 기본 URL 검증
  if (!baseUrl) {
    errors.push('API base URL이 설정되지 않았습니다.');
  } else if (!baseUrl.startsWith('http') && typeof window !== 'undefined') {
    warnings.push('상대 경로 API URL을 사용하고 있습니다. 절대 URL 사용을 권장합니다.');
  }
  
  // 환경변수 확인
  if (typeof window !== 'undefined') {
    // 클라이언트 사이드 검증
    if (!process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_APP_URL) {
      warnings.push('NEXT_PUBLIC_API_URL 또는 NEXT_PUBLIC_APP_URL 환경변수 설정을 권장합니다.');
    }
  }
  
  // HTTPS 검증 (프로덕션 환경)
  if (process.env.NODE_ENV === 'production' && baseUrl.startsWith('http://')) {
    warnings.push('프로덕션 환경에서 HTTP 대신 HTTPS 사용을 권장합니다.');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ===== 타입 정의 =====
export type ApiConfigType = typeof API_CONFIG;
export type ApiEnvironmentConfig = typeof API_CONFIG.development | typeof API_CONFIG.production; 