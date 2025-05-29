/**
 * 강화된 인증 시스템
 * JWT Access/Refresh Token, HttpOnly 쿠키, 비정상 로그인 탐지, 세션 관리
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// 환경 변수 및 설정
const JWT_ACCESS_SECRET = process.env.JWT_SECRET || 'access-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-key';
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

// 인터페이스 정의
export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  isActive: boolean;
  isTwoFactorEnabled: boolean;
  lastLoginAt?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  passwordChangedAt?: Date;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
  jti: string;
  sessionId: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
  sessionId: string;
  iat: number;
  exp: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  sessionId: string;
}

export interface LoginAttempt {
  ip: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  userId?: string;
  failureReason?: string;
}

export interface SecurityEvent {
  type: 'login' | 'logout' | 'token_refresh' | 'suspicious_activity' | 'password_change';
  userId: string;
  ip: string;
  userAgent: string;
  timestamp: Date;
  details: any;
}

// 토큰 블랙리스트 관리
class TokenBlacklist {
  private blacklistedTokens = new Set<string>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 1시간마다 만료된 토큰 정리
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 3600000);
  }

  add(jti: string, expiresAt: Date): void {
    this.blacklistedTokens.add(`${jti}:${expiresAt.getTime()}`);
  }

  isBlacklisted(jti: string): boolean {
    // 해당 JTI가 블랙리스트에 있는지 확인
    for (const entry of this.blacklistedTokens) {
      if (entry.startsWith(`${jti}:`)) {
        const expiresAt = parseInt(entry.split(':')[1]);
        if (Date.now() < expiresAt) {
          return true;
        }
      }
    }
    return false;
  }

  private cleanup(): void {
    const now = Date.now();
    const toRemove: string[] = [];

    for (const entry of this.blacklistedTokens) {
      const expiresAt = parseInt(entry.split(':')[1]);
      if (now >= expiresAt) {
        toRemove.push(entry);
      }
    }

    toRemove.forEach(entry => this.blacklistedTokens.delete(entry));
    console.log(`🧹 Cleaned up ${toRemove.length} expired blacklisted tokens`);
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// 로그인 시도 추적
class LoginAttemptTracker {
  private attempts = new Map<string, LoginAttempt[]>();
  private readonly maxAttempts = 5;
  private readonly windowMs = 15 * 60 * 1000; // 15분
  private readonly lockoutMs = 30 * 60 * 1000; // 30분

  recordAttempt(attempt: LoginAttempt): void {
    const key = `${attempt.ip}:${attempt.userId || 'unknown'}`;
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }

    const userAttempts = this.attempts.get(key)!;
    userAttempts.push(attempt);

    // 오래된 시도 제거
    const cutoff = new Date(Date.now() - this.windowMs);
    this.attempts.set(key, userAttempts.filter(a => a.timestamp > cutoff));
  }

  isBlocked(ip: string, userId?: string): boolean {
    const key = `${ip}:${userId || 'unknown'}`;
    const userAttempts = this.attempts.get(key) || [];
    
    const recentFailures = userAttempts.filter(
      a => !a.success && a.timestamp > new Date(Date.now() - this.windowMs)
    );

    return recentFailures.length >= this.maxAttempts;
  }

  getFailureCount(ip: string, userId?: string): number {
    const key = `${ip}:${userId || 'unknown'}`;
    const userAttempts = this.attempts.get(key) || [];
    
    return userAttempts.filter(
      a => !a.success && a.timestamp > new Date(Date.now() - this.windowMs)
    ).length;
  }

  reset(ip: string, userId?: string): void {
    const key = `${ip}:${userId || 'unknown'}`;
    this.attempts.delete(key);
  }
}

// 세션 관리
class SessionManager {
  private sessions = new Map<string, {
    userId: string;
    createdAt: Date;
    lastActivity: Date;
    ip: string;
    userAgent: string;
    isActive: boolean;
  }>();

  createSession(userId: string, ip: string, userAgent: string): string {
    const sessionId = crypto.randomUUID();
    
    this.sessions.set(sessionId, {
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
      ip,
      userAgent,
      isActive: true,
    });

    return sessionId;
  }

  validateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isActive) {
      return false;
    }

    // 세션 활동 시간 업데이트
    session.lastActivity = new Date();
    return true;
  }

  invalidateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
    }
  }

  invalidateUserSessions(userId: string): number {
    let count = 0;
    for (const [sessionId, session] of this.sessions) {
      if (session.userId === userId && session.isActive) {
        session.isActive = false;
        count++;
      }
    }
    return count;
  }

  getUserSessions(userId: string) {
    return Array.from(this.sessions.entries())
      .filter(([_, session]) => session.userId === userId && session.isActive)
      .map(([sessionId, session]) => ({
        sessionId,
        ...session,
      }));
  }

  cleanup(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24시간
    const toRemove: string[] = [];

    for (const [sessionId, session] of this.sessions) {
      if (session.lastActivity < cutoff || !session.isActive) {
        toRemove.push(sessionId);
      }
    }

    toRemove.forEach(sessionId => this.sessions.delete(sessionId));
    console.log(`🧹 Cleaned up ${toRemove.length} expired sessions`);
  }
}

// 보안 이벤트 로거
class SecurityEventLogger {
  private events: SecurityEvent[] = [];
  private readonly maxEvents = 10000;

  log(event: SecurityEvent): void {
    this.events.push(event);
    
    // 이벤트 수 제한
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // 의심스러운 활동 감지
    this.detectSuspiciousActivity(event);
  }

  getEvents(userId?: string, type?: string, limit = 100): SecurityEvent[] {
    let filtered = this.events;

    if (userId) {
      filtered = filtered.filter(e => e.userId === userId);
    }

    if (type) {
      filtered = filtered.filter(e => e.type === type);
    }

    return filtered.slice(-limit);
  }

  private detectSuspiciousActivity(event: SecurityEvent): void {
    // 동일 IP에서 짧은 시간 내 다수 로그인 시도
    if (event.type === 'login') {
      const recentLogins = this.events.filter(
        e => e.type === 'login' && 
        e.ip === event.ip && 
        e.timestamp > new Date(Date.now() - 5 * 60 * 1000) // 5분
      );

      if (recentLogins.length > 10) {
        console.warn(`🚨 Suspicious activity detected: Multiple login attempts from IP ${event.ip}`);
        // 여기서 추가 보안 조치 실행 가능
      }
    }

    // 비정상적인 지역에서의 로그인
    // 토큰 갱신 빈도 이상
    // 등등의 추가 탐지 로직 구현 가능
  }
}

// 메인 인증 서비스 클래스
export class EnhancedAuthService {
  private tokenBlacklist = new TokenBlacklist();
  private loginTracker = new LoginAttemptTracker();
  private sessionManager = new SessionManager();
  private securityLogger = new SecurityEventLogger();

  constructor() {
    // 정기적인 정리 작업
    setInterval(() => {
      this.sessionManager.cleanup();
    }, 3600000); // 1시간마다
  }

  // 사용자 권한 매핑
  private getUserPermissions(user: User): string[] {
    const basePermissions = ['read:profile', 'update:profile'];
    
    switch (user.role) {
      case 'superadmin':
        return [
          ...basePermissions,
          'read:users', 'write:users', 'delete:users',
          'read:trades', 'write:trades', 'admin:trades',
          'read:system', 'write:system', 'admin:system',
          'read:analytics', 'write:analytics',
          'read:logs', 'write:logs',
        ];
      case 'admin':
        return [
          ...basePermissions,
          'read:users', 'write:users',
          'read:trades', 'write:trades',
          'read:analytics',
          'read:logs',
        ];
      default:
        return basePermissions;
    }
  }

  // 토큰 쌍 생성
  generateTokenPair(user: User, ip: string, userAgent: string): TokenPair {
    const sessionId = this.sessionManager.createSession(user.id, ip, userAgent);
    const jti = crypto.randomUUID();
    
    const accessPayload: JWTPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions: this.getUserPermissions(user),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiry(ACCESS_TOKEN_EXPIRY),
      jti,
      sessionId,
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: user.id,
      jti,
      sessionId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.parseExpiry(REFRESH_TOKEN_EXPIRY),
    };

    const accessToken = jwt.sign(accessPayload, JWT_ACCESS_SECRET, {
      algorithm: 'HS256',
      issuer: 'cryptotrader',
      audience: 'cryptotrader-users',
    });

    const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, {
      algorithm: 'HS256',
      issuer: 'cryptotrader',
      audience: 'cryptotrader-refresh',
    });

    // 보안 이벤트 로깅
    this.securityLogger.log({
      type: 'login',
      userId: user.id,
      ip,
      userAgent,
      timestamp: new Date(),
      details: { sessionId, jti },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.parseExpiry(ACCESS_TOKEN_EXPIRY),
      sessionId,
    };
  }

  // 액세스 토큰 검증
  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const payload = jwt.verify(token, JWT_ACCESS_SECRET, {
        algorithms: ['HS256'],
        issuer: 'cryptotrader',
        audience: 'cryptotrader-users',
      }) as JWTPayload;

      // 토큰 블랙리스트 확인
      if (this.tokenBlacklist.isBlacklisted(payload.jti)) {
        throw new Error('Token is blacklisted');
      }

      // 세션 유효성 확인
      if (!this.sessionManager.validateSession(payload.sessionId)) {
        throw new Error('Invalid session');
      }

      return payload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired access token');
    }
  }

  // 리프레시 토큰 검증
  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const payload = jwt.verify(token, JWT_REFRESH_SECRET, {
        algorithms: ['HS256'],
        issuer: 'cryptotrader',
        audience: 'cryptotrader-refresh',
      }) as RefreshTokenPayload;

      // 토큰 블랙리스트 확인
      if (this.tokenBlacklist.isBlacklisted(payload.jti)) {
        throw new Error('Refresh token is blacklisted');
      }

      // 세션 유효성 확인
      if (!this.sessionManager.validateSession(payload.sessionId)) {
        throw new Error('Invalid session');
      }

      return payload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  // 토큰 갱신
  async refreshTokens(refreshToken: string, ip: string, userAgent: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);
    
    // 기존 토큰 블랙리스트에 추가
    const expiresAt = new Date(payload.exp * 1000);
    this.tokenBlacklist.add(payload.jti, expiresAt);

    // 사용자 정보 조회 (실제 구현에서는 데이터베이스에서 조회)
    const user = await this.getUserById(payload.sub);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // 새 토큰 쌍 생성
    const newTokens = this.generateTokenPair(user, ip, userAgent);

    // 보안 이벤트 로깅
    this.securityLogger.log({
      type: 'token_refresh',
      userId: user.id,
      ip,
      userAgent,
      timestamp: new Date(),
      details: { oldJti: payload.jti, newJti: newTokens.sessionId },
    });

    return newTokens;
  }

  // 로그인 시도 기록 및 검증
  async attemptLogin(
    email: string,
    password: string,
    ip: string,
    userAgent: string
  ): Promise<{ success: boolean; tokens?: TokenPair; user?: User; error?: string }> {
    
    // IP 차단 확인
    if (this.loginTracker.isBlocked(ip)) {
      const attempt: LoginAttempt = {
        ip,
        userAgent,
        timestamp: new Date(),
        success: false,
        failureReason: 'IP blocked due to too many failed attempts',
      };
      this.loginTracker.recordAttempt(attempt);
      
      return {
        success: false,
        error: 'Too many failed login attempts. Please try again later.',
      };
    }

    try {
      // 사용자 조회 (실제 구현에서는 데이터베이스에서 조회)
      const user = await this.getUserByEmail(email);
      
      if (!user) {
        const attempt: LoginAttempt = {
          ip,
          userAgent,
          timestamp: new Date(),
          success: false,
          failureReason: 'User not found',
        };
        this.loginTracker.recordAttempt(attempt);
        
        return { success: false, error: 'Invalid credentials' };
      }

      // 계정 잠금 확인
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const attempt: LoginAttempt = {
          ip,
          userAgent,
          timestamp: new Date(),
          success: false,
          userId: user.id,
          failureReason: 'Account locked',
        };
        this.loginTracker.recordAttempt(attempt);
        
        return { success: false, error: 'Account is temporarily locked' };
      }

      // 비밀번호 검증
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        const attempt: LoginAttempt = {
          ip,
          userAgent,
          timestamp: new Date(),
          success: false,
          userId: user.id,
          failureReason: 'Invalid password',
        };
        this.loginTracker.recordAttempt(attempt);
        
        return { success: false, error: 'Invalid credentials' };
      }

      // 계정 활성화 확인
      if (!user.isActive) {
        const attempt: LoginAttempt = {
          ip,
          userAgent,
          timestamp: new Date(),
          success: false,
          userId: user.id,
          failureReason: 'Account inactive',
        };
        this.loginTracker.recordAttempt(attempt);
        
        return { success: false, error: 'Account is inactive' };
      }

      // 성공적인 로그인
      const tokens = this.generateTokenPair(user, ip, userAgent);
      
      const attempt: LoginAttempt = {
        ip,
        userAgent,
        timestamp: new Date(),
        success: true,
        userId: user.id,
      };
      this.loginTracker.recordAttempt(attempt);
      
      // 로그인 시도 카운터 리셋
      this.loginTracker.reset(ip, user.id);

      return { success: true, tokens, user };

    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  // 로그아웃
  async logout(accessToken: string): Promise<void> {
    try {
      const payload = await this.verifyAccessToken(accessToken);
      
      // 토큰 블랙리스트에 추가
      const expiresAt = new Date(payload.exp * 1000);
      this.tokenBlacklist.add(payload.jti, expiresAt);
      
      // 세션 무효화
      this.sessionManager.invalidateSession(payload.sessionId);

      // 보안 이벤트 로깅
      this.securityLogger.log({
        type: 'logout',
        userId: payload.sub,
        ip: '', // 실제 구현에서는 요청에서 IP 추출
        userAgent: '', // 실제 구현에서는 요청에서 User-Agent 추출
        timestamp: new Date(),
        details: { jti: payload.jti, sessionId: payload.sessionId },
      });

    } catch (error) {
      // 이미 무효한 토큰이어도 로그아웃 처리
      console.warn('Logout with invalid token:', error);
    }
  }

  // 모든 세션 로그아웃
  async logoutAllSessions(userId: string): Promise<number> {
    const count = this.sessionManager.invalidateUserSessions(userId);
    
    this.securityLogger.log({
      type: 'logout',
      userId,
      ip: '',
      userAgent: '',
      timestamp: new Date(),
      details: { type: 'all_sessions', sessionCount: count },
    });

    return count;
  }

  // HttpOnly 쿠키 설정
  setAuthCookies(response: NextResponse, tokens: TokenPair): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };

    // 액세스 토큰 (짧은 만료 시간)
    response.cookies.set('accessToken', tokens.accessToken, {
      ...cookieOptions,
      maxAge: tokens.expiresIn,
    });

    // 리프레시 토큰 (긴 만료 시간)
    response.cookies.set('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: this.parseExpiry(REFRESH_TOKEN_EXPIRY),
    });
  }

  // 쿠키 제거
  clearAuthCookies(response: NextResponse): void {
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
  }

  // 요청에서 토큰 추출
  extractTokenFromRequest(request: NextRequest): string | null {
    // 1. Authorization 헤더에서 추출
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2. 쿠키에서 추출
    const cookieToken = request.cookies.get('accessToken')?.value;
    if (cookieToken) {
      return cookieToken;
    }

    return null;
  }

  // 보안 통계
  getSecurityStats() {
    return {
      activeSessionsCount: this.sessionManager.getUserSessions('').length,
      blacklistedTokensCount: this.tokenBlacklist['blacklistedTokens'].size,
      recentSecurityEvents: this.securityLogger.getEvents(undefined, undefined, 10),
    };
  }

  // 유틸리티 메서드들
  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 900; // 15분 기본값
    }
  }

  // 실제 구현에서는 데이터베이스에서 조회
  private async getUserById(id: string): Promise<User | null> {
    // TODO: 데이터베이스 조회 구현
    return null;
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    // TODO: 데이터베이스 조회 구현
    return null;
  }

  // 정리 작업
  destroy(): void {
    this.tokenBlacklist.destroy();
  }
}

// 커스텀 에러 클래스
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// 싱글톤 인스턴스
export const authService = new EnhancedAuthService(); 