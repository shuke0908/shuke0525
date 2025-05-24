// 애플리케이션 환경 변수와 설정을 중앙화하는 파일

// 기본 URL 설정
export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// API URL 설정
export const API_URL = process.env.NEXT_PUBLIC_API_URL || `${APP_URL}/api`;

// Supabase 설정
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 환경 설정
export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
export const IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
export const IS_TEST = process.env.NODE_ENV === 'test';

// JWT 설정
export const JWT_EXPIRY = '7d'; // JWT 만료 기간

// 브라우저 환경인지 확인
export const IS_BROWSER = typeof window !== 'undefined';

// CORS 설정
export const CORS_ORIGIN =
  process.env.CORS_ORIGIN || (IS_PRODUCTION ? APP_URL : '*');

// 애플리케이션 정보
export const APP_INFO = {
  name: 'Shuke0525',
  description: 'Shuke0525 Application',
  version: '1.0.0',
};

// 외부 API 설정
export const EXTERNAL_APIS = {
  // 여기에 외부 API 설정 추가
};
