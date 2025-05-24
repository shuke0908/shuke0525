/**
 * API 설정 관리
 * 환경변수 기반으로 API URL과 설정을 동적으로 관리합니다.
 */

// ===== 환경변수 기반 API URL 설정 =====
export function getApiBaseUrl(): string {
  // 1. 환경변수에서 명시적으로 설정된 API URL 확인
  if (typeof window !== 'undefined') {
    // 클라이언트 사이드에서는 NEXT_PUBLIC_* 환경변수만 사용 가능
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (apiUrl) {
      // 절대 URL인 경우 그대로 반환
      if (apiUrl.startsWith('http')) {
        return apiUrl;
      }
      // 상대 경로인 경우 현재 origin과 조합
      return `${window.location.origin}${apiUrl}`;
    }
    
    // APP_URL이 설정된 경우 /api를 추가
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl) {
      return `${appUrl}/api`;
    }
    
    // 기본값: 현재 도메인의 /api
    return `${window.location.origin}/api`;
  } else {
    // 서버 사이드에서는 모든 환경변수 사용 가능
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL;
    if (apiUrl) {
      return apiUrl.startsWith('http') ? apiUrl : `http://localhost:3000${apiUrl}`;
    }
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
    if (appUrl) {
      return `${appUrl}/api`;
    }
    
    // 서버 사이드 기본값
    return 'http://localhost:3000/api';
  }
}

// ===== API 기본 설정 =====
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

// ===== 현재 환경 설정 가져오기 =====
export function getCurrentConfig() {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return {
    ...API_CONFIG,
    ...(isDevelopment ? API_CONFIG.development : API_CONFIG.production),
  };
}

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

// ===== 환경별 API URL 로깅 =====
export function logApiConfig() {
  if (process.env.NODE_ENV === 'development') {
    const config = validateApiConfig();
    console.group('🔧 API Configuration');
    console.log('Base URL:', getApiBaseUrl());
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Validation:', config.isValid ? '✅ Valid' : '❌ Invalid');
    
    if (config.errors.length > 0) {
      console.error('Errors:', config.errors);
    }
    
    if (config.warnings.length > 0) {
      console.warn('Warnings:', config.warnings);
    }
    
    console.groupEnd();
  }
}

// ===== 타입 정의 =====
export type ApiConfigType = typeof API_CONFIG;
export type ApiEnvironmentConfig = typeof API_CONFIG.development | typeof API_CONFIG.production; 