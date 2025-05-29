import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { type User } from './userStore';
import { supabaseAdmin } from './supabase';

// 환경 변수 기본값 설정
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-development';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

/**
 * 비밀번호 해싱
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * 비밀번호 검증
 */
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * JWT 액세스 토큰 생성
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'quanttrade',
    audience: 'quanttrade-users'
  });
}

/**
 * JWT 리프레시 토큰 생성
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
    issuer: 'quanttrade',
    audience: 'quanttrade-refresh'
  });
}

/**
 * JWT 토큰 검증
 */
export function verifyToken(token: string, isRefreshToken = false): JWTPayload | null {
  try {
    const audience = isRefreshToken ? 'quanttrade-refresh' : 'quanttrade-users';
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'quanttrade',
      audience
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * JWT 토큰 검증 (별칭)
 */
export const verifyJWT = verifyToken;

/**
 * 토큰 쌍 생성 (액세스 + 리프레시)
 */
export function generateTokenPair(user: User): AuthTokens {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    user
  };
}

/**
 * 단일 토큰 생성 (호환성을 위한 별칭)
 */
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role
  };
  return generateAccessToken(payload);
}

/**
 * 쿠키에서 토큰 추출
 */
export function getTokenFromCookies(): string | null {
  try {
    const cookieStore = cookies();
    return cookieStore.get('accessToken')?.value || null;
  } catch (error) {
    console.error('Failed to get token from cookies:', error);
    return null;
  }
}

/**
 * 요청 헤더에서 토큰 추출
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  // Authorization 헤더에서 Bearer 토큰 추출
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 쿠키에서 토큰 추출
  const cookieToken = request.cookies.get('accessToken')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  return null;
}

/**
 * 현재 사용자 정보 가져오기
 */
export async function getCurrentUser(request?: NextRequest): Promise<User | null> {
  try {
    let token: string | null = null;

    if (request) {
      token = getTokenFromRequest(request);
    } else {
      token = getTokenFromCookies();
    }

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    // 실제 구현에서는 데이터베이스에서 사용자 정보를 조회해야 함
    // 현재는 토큰 페이로드에서 기본 정보만 반환
    const user: User = {
      id: payload.userId,
      email: payload.email,
      username: payload.email.split('@')[0],
      role: payload.role as 'user' | 'admin' | 'superadmin',
      balance: 0, // 실제로는 DB에서 조회
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return user;
  } catch (error) {
    console.error('Failed to get current user:', error);
    return null;
  }
}

/**
 * 관리자 권한 확인
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin' || user?.role === 'superadmin';
}

/**
 * 슈퍼 관리자 권한 확인
 */
export function isSuperAdmin(user: User | null): boolean {
  return user?.role === 'superadmin';
}

/**
 * 권한 확인 (계층적)
 */
export function hasPermission(user: User | null, requiredRole: 'user' | 'admin' | 'superadmin'): boolean {
  if (!user || !user.isActive) return false;

  const roleHierarchy = {
    user: 0,
    admin: 1,
    superadmin: 2
  };

  const userLevel = roleHierarchy[user.role] || -1;
  const requiredLevel = roleHierarchy[requiredRole] || 999;

  return userLevel >= requiredLevel;
}

/**
 * 토큰 만료 시간 확인
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
}

/**
 * 토큰 갱신 필요 여부 확인
 */
export function shouldRefreshToken(token: string): boolean {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;

  const now = new Date();
  const timeUntilExpiry = expiration.getTime() - now.getTime();
  const fiveMinutes = 5 * 60 * 1000; // 5분

  return timeUntilExpiry < fiveMinutes;
}

/**
 * 안전한 사용자 정보 반환 (비밀번호 제외)
 */
export function sanitizeUser(user: any): User {
  const { password, ...sanitized } = user;
  return sanitized;
}

/**
 * 로그인 시도 제한 (간단한 구현)
 */
const loginAttempts = new Map<string, { count: number; lastAttempt: Date }>();

export function checkLoginAttempts(email: string): boolean {
  const attempts = loginAttempts.get(email);
  const now = new Date();
  const maxAttempts = 5;
  const lockoutDuration = 15 * 60 * 1000; // 15분

  if (!attempts) {
    return true; // 첫 시도
  }

  // 잠금 시간이 지났으면 초기화
  if (now.getTime() - attempts.lastAttempt.getTime() > lockoutDuration) {
    loginAttempts.delete(email);
    return true;
  }

  return attempts.count < maxAttempts;
}

export function recordLoginAttempt(email: string, success: boolean): void {
  const now = new Date();
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: now };

  if (success) {
    loginAttempts.delete(email); // 성공 시 기록 삭제
  } else {
    attempts.count += 1;
    attempts.lastAttempt = now;
    loginAttempts.set(email, attempts);
  }
}

/**
 * 인증된 사용자 정보 가져오기 (비동기 버전)
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<User | null> {
  try {
    const token = getTokenFromRequest(request);
    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    // Supabase에서 사용자 정보 조회
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', payload.email)
      .single();

    if (error || !user) {
      return null;
    }

    // 비밀번호 제외하고 반환
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  } catch (error) {
    console.error('Failed to get authenticated user:', error);
    return null;
  }
}

/**
 * 개발 환경용 기본 사용자 생성
 */
export function createDevelopmentUser(): User {
  return {
    id: 'dev-user-1',
    email: 'admin@quanttrade.com',
    username: 'admin',
    role: 'superadmin',
    balance: 10000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * 쿠키 설정 옵션
 */
export function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    maxAge: 7 * 24 * 60 * 60, // 7일
    path: '/',
  };
}

/**
 * 사용자 ID 쿠키 설정 옵션 (클라이언트에서 접근 가능)
 */
export function getUserIdCookieOptions() {
  return {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    maxAge: 7 * 24 * 60 * 60, // 7일
    path: '/',
  };
} 