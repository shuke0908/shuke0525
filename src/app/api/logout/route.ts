import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  console.log('🚪 Logout request via App Router');

  try {
    const response = NextResponse.json(
      { message: 'Logout successful' },
      { 
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'https://project-delta-two-14.vercel.app',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );

    // 모든 인증 쿠키 제거 (크로스 오리진 지원)
    response.cookies.set('authToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 0, // 즉시 만료
      path: '/'
    });

    response.cookies.set('userId', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 0, // 즉시 만료
      path: '/'
    });

    // express-session 호환성을 위한 쿠키 제거
    response.cookies.set('connect.sid', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 0,
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Internal server error during logout' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'https://project-delta-two-14.vercel.app',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );
  }
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'https://project-delta-two-14.vercel.app',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
} 