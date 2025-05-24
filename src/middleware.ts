import { NextRequest, NextResponse } from 'next/server';
import { validateEnvironment } from './lib/environment';

export const config = {
  matcher: [
    /*
     * 미들웨어를 적용할 경로를 지정합니다.
     * - 모든 API 경로
     * - 정적 파일 제외
     */
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // CORS 헤더 설정
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  res.headers.set('Access-Control-Allow-Origin', corsOrigin);
  res.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  );
  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );

  // 보안 헤더 설정
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // API 경로에서는 환경 변수 검증
  if (req.nextUrl.pathname.startsWith('/api/')) {
    // 서버 사이드에서만 실행
    if (typeof window === 'undefined') {
      validateEnvironment();
    }
  }

  // 프리플라이트 요청 처리
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: res.headers,
    });
  }

  return res;
}
