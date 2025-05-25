import { NextRequest, NextResponse } from 'next/server';

/**
 * 로그아웃 처리
 */
export async function POST(request: NextRequest) {
  try {
    // 헤더에서 사용자 정보 추출 (미들웨어에서 설정)
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');

    // 응답 생성
    const response = NextResponse.json(
      {
        success: true,
        message: 'Logout successful'
      },
      { status: 200 }
    );

    // 쿠키 삭제
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0 // 즉시 만료
    };

    response.cookies.set('accessToken', '', cookieOptions);
    response.cookies.set('refreshToken', '', cookieOptions);

    // 로그아웃 로그
    if (userEmail) {
      console.log(`[LOGOUT] User ${userEmail} logged out successfully`);
    }

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    
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
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 