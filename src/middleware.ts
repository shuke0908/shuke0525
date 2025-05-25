import { NextRequest, NextResponse } from 'next/server';
import { validateEnvironment } from './lib/environment';
import { verifyToken, getCurrentUser, hasPermission } from './lib/auth';

// 보호된 라우트 정의
const PROTECTED_ROUTES = [
  '/dashboard',
  '/wallet',
  '/quick-trade',
  '/flash-trade',
  '/profile',
  '/settings'
];

// 관리자 전용 라우트
const ADMIN_ROUTES = [
  '/admin'
];

// 인증이 필요 없는 공개 라우트
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/refresh'
];

// API 라우트 보호 설정
const PROTECTED_API_ROUTES = [
  '/api/user',
  '/api/dashboard',
  '/api/wallet',
  '/api/quick-trade',
  '/api/flash-trade'
];

const ADMIN_API_ROUTES = [
  '/api/admin'
];

/**
 * 라우트가 보호된 라우트인지 확인
 */
function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * 관리자 라우트인지 확인
 */
function isAdminRoute(pathname: string): boolean {
  return ADMIN_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * 공개 라우트인지 확인
 */
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route));
}

/**
 * 보호된 API 라우트인지 확인
 */
function isProtectedApiRoute(pathname: string): boolean {
  return PROTECTED_API_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * 관리자 API 라우트인지 확인
 */
function isAdminApiRoute(pathname: string): boolean {
  return ADMIN_API_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * 인증 실패 응답 생성
 */
function createUnauthorizedResponse(request: NextRequest, reason: string = 'Unauthorized') {
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  
  if (isApiRoute) {
    return NextResponse.json(
      { 
        success: false, 
        error: reason,
        code: 'UNAUTHORIZED',
        timestamp: new Date().toISOString()
      },
      { status: 401 }
    );
  }

  // 웹 페이지의 경우 로그인 페이지로 리다이렉트
  const loginUrl = new URL('/auth/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

/**
 * 권한 부족 응답 생성
 */
function createForbiddenResponse(request: NextRequest, reason: string = 'Insufficient permissions') {
  const isApiRoute = request.nextUrl.pathname.startsWith('/api');
  
  if (isApiRoute) {
    return NextResponse.json(
      { 
        success: false, 
        error: reason,
        code: 'FORBIDDEN',
        timestamp: new Date().toISOString()
      },
      { status: 403 }
    );
  }

  // 웹 페이지의 경우 접근 거부 페이지로 리다이렉트
  return NextResponse.redirect(new URL('/auth/forbidden', request.url));
}

/**
 * 요청 로깅
 */
function logRequest(request: NextRequest, user: any = null, action: string = 'ACCESS') {
  const timestamp = new Date().toISOString();
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const userId = user?.id || 'anonymous';
  const userRole = user?.role || 'none';

  console.log(`[${timestamp}] ${action} - ${request.method} ${request.nextUrl.pathname} - User: ${userId} (${userRole}) - IP: ${ip} - UA: ${userAgent}`);
}

/**
 * Rate Limiting (간단한 구현)
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(request: NextRequest): boolean {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15분
  const maxRequests = 100; // 15분당 최대 100 요청

  const current = requestCounts.get(ip);
  
  if (!current || now > current.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  return true;
}

/**
 * 메인 미들웨어 함수
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 정적 파일과 Next.js 내부 경로는 건너뛰기
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Rate Limiting 체크
  if (!checkRateLimit(request)) {
    logRequest(request, null, 'RATE_LIMITED');
    return NextResponse.json(
      { 
        success: false, 
        error: 'Too many requests',
        code: 'RATE_LIMITED',
        timestamp: new Date().toISOString()
      },
      { status: 429 }
    );
  }

  // 공개 라우트는 인증 없이 통과
  if (isPublicRoute(pathname)) {
    logRequest(request, null, 'PUBLIC_ACCESS');
    return NextResponse.next();
  }

  // 토큰 추출
  const token = request.cookies.get('accessToken')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    logRequest(request, null, 'NO_TOKEN');
    return createUnauthorizedResponse(request, 'No authentication token provided');
  }

  // 토큰 검증
  const payload = verifyToken(token);
  if (!payload) {
    logRequest(request, null, 'INVALID_TOKEN');
    return createUnauthorizedResponse(request, 'Invalid or expired token');
  }

  // 사용자 정보 조회
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      logRequest(request, null, 'USER_NOT_FOUND');
      return createUnauthorizedResponse(request, 'User not found');
    }

    // 계정 활성화 상태 확인
    if (!user.isActive) {
      logRequest(request, user, 'ACCOUNT_INACTIVE');
      return createUnauthorizedResponse(request, 'Account is inactive');
    }

    // 관리자 라우트 접근 권한 확인
    if (isAdminRoute(pathname) || isAdminApiRoute(pathname)) {
      if (!hasPermission(user, 'admin')) {
        logRequest(request, user, 'ADMIN_ACCESS_DENIED');
        return createForbiddenResponse(request, 'Admin access required');
      }
    }

    // 보호된 라우트 접근 권한 확인
    if (isProtectedRoute(pathname) || isProtectedApiRoute(pathname)) {
      if (!hasPermission(user, 'user')) {
        logRequest(request, user, 'USER_ACCESS_DENIED');
        return createForbiddenResponse(request, 'User access required');
      }
    }

    // 요청 헤더에 사용자 정보 추가 (API에서 사용 가능)
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', user.id);
    requestHeaders.set('x-user-email', user.email);
    requestHeaders.set('x-user-role', user.role);

    logRequest(request, user, 'AUTHORIZED_ACCESS');

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    console.error('Middleware error:', error);
    logRequest(request, null, 'MIDDLEWARE_ERROR');
    return createUnauthorizedResponse(request, 'Authentication error');
  }
}

/**
 * 미들웨어 설정
 */
export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 대해 미들웨어 실행:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

/**
 * 개발 환경용 유틸리티 함수들
 */
export function clearRateLimit(ip?: string) {
  if (ip) {
    requestCounts.delete(ip);
  } else {
    requestCounts.clear();
  }
}

export function getRateLimitStatus(ip: string) {
  return requestCounts.get(ip) || null;
}
