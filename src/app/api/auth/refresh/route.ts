import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, generateTokenPair, sanitizeUser } from '@/lib/auth';

// 개발 환경용 사용자 데이터 (실제로는 데이터베이스에서 조회)
const developmentUsers = [
  {
    id: 'admin-1',
    email: 'admin@quanttrade.com',
    username: 'admin',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm',
    role: 'superadmin' as const,
    balance: 10000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'user-1',
    email: 'user@quanttrade.com',
    username: 'user',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm',
    role: 'user' as const,
    balance: 1000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'trader-1',
    email: 'trader@quanttrade.com',
    username: 'trader',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm',
    role: 'admin' as const,
    balance: 5000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

/**
 * 사용자 조회 (개발 환경용)
 */
async function findUserById(userId: string) {
  return developmentUsers.find(user => user.id === userId) || null;
}

/**
 * 토큰 갱신 처리
 */
export async function POST(request: NextRequest) {
  try {
    // 리프레시 토큰 추출
    const refreshToken = request.cookies.get('refreshToken')?.value ||
                        request.headers.get('x-refresh-token');

    if (!refreshToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Refresh token not provided',
          code: 'NO_REFRESH_TOKEN'
        },
        { status: 401 }
      );
    }

    // 리프레시 토큰 검증
    const payload = verifyToken(refreshToken, true);
    if (!payload) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired refresh token',
          code: 'INVALID_REFRESH_TOKEN'
        },
        { status: 401 }
      );
    }

    // 사용자 조회
    const user = await findUserById(payload.userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    // 계정 활성화 상태 확인
    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account is inactive',
          code: 'ACCOUNT_INACTIVE'
        },
        { status: 403 }
      );
    }

    // 새로운 토큰 쌍 생성
    const tokens = generateTokenPair(user);

    // 응답 생성
    const response = NextResponse.json(
      {
        success: true,
        message: 'Token refreshed successfully',
        user: sanitizeUser(user),
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        }
      },
      { status: 200 }
    );

    // 쿠키에 새 토큰 저장
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7일
    };

    response.cookies.set('accessToken', tokens.accessToken, cookieOptions);
    response.cookies.set('refreshToken', tokens.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 // 리프레시 토큰은 30일
    });

    // 토큰 갱신 로그
    console.log(`[TOKEN_REFRESH] User ${user.email} (${user.role}) refreshed token`);

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS 요청 처리 (CORS)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Refresh-Token',
    },
  });
} 