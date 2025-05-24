import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export async function POST(request: NextRequest) {
  console.log('🔐 Login attempt via App Router');
  
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log(`Login attempt for email: ${email}`);
    
    // 테스트 인증 (실제 환경에서는 데이터베이스 검증)
    if (email === 'shuke0525@gmail.com' && password === 'michael112') {
      // JWT 토큰 생성
      const authToken = jwt.sign(
        { userId: '1', email: email, role: 'admin' }, 
        JWT_SECRET, 
        { expiresIn: '1h' }
      );

      const response = NextResponse.json({
        message: 'Login successful',
        user: {
          id: '1',
          email: email,
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          balance: '10000.00',
          authToken: authToken
        }
      }, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'https://project-delta-two-14.vercel.app',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }
      });

      // 세션 쿠키 설정 (크로스 오리진 지원)
      response.cookies.set('authToken', authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 3600, // 1시간
        path: '/'
      });

      // 사용자 ID 쿠키 설정 (클라이언트에서 접근 가능)
      response.cookies.set('userId', '1', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 3600,
        path: '/'
      });

      return response;

    } else if (email === 'test@jjk.app' && password === 'Aa112211') {
      // JWT 토큰 생성
      const authToken = jwt.sign(
        { userId: '2', email: email, role: 'user' }, 
        JWT_SECRET, 
        { expiresIn: '1h' }
      );

      const response = NextResponse.json({
        message: 'Login successful',
        user: {
          id: '2',
          email: email,
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          balance: '1000.00',
          authToken: authToken
        }
      }, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'https://project-delta-two-14.vercel.app',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }
      });

      // 세션 쿠키 설정 (크로스 오리진 지원)
      response.cookies.set('authToken', authToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 3600, // 1시간
        path: '/'
      });

      // 사용자 ID 쿠키 설정 (클라이언트에서 접근 가능)
      response.cookies.set('userId', '2', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 3600,
        path: '/'
      });

      return response;

    } else {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { 
          status: 401,
          headers: {
            'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'https://project-delta-two-14.vercel.app',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
          }
        }
      );
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error during login' },
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