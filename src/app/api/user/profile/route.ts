import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export async function GET(request: NextRequest) {
  console.log('👤 User profile request via App Router');

  try {
    // 쿠키에서 authToken 추출
    const authToken = request.cookies.get('authToken')?.value;
    
    if (!authToken) {
      return NextResponse.json(
        { message: 'No authentication token found' },
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

    // JWT 토큰 검증
    try {
      const decoded = jwt.verify(authToken, JWT_SECRET) as any;
      
      // 테스트 사용자 정보 (실제로는 데이터베이스에서 조회)
      let userProfile;
      if (decoded.userId === '1') {
        userProfile = {
          id: '1',
          email: 'shuke0525@gmail.com',
          firstName: 'Admin',
          lastName: 'User',
          role: 'admin',
          balance: '10000.00',
          vipLevel: 'platinum',
          kycStatus: 'verified',
          isTwoFactorEnabled: false
        };
      } else if (decoded.userId === '2') {
        userProfile = {
          id: '2',
          email: 'test@jjk.app',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
          balance: '1000.00',
          vipLevel: 'bronze',
          kycStatus: 'pending',
          isTwoFactorEnabled: false
        };
      } else {
        return NextResponse.json(
          { message: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(userProfile, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'https://project-delta-two-14.vercel.app',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }
      });

    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return NextResponse.json(
        { message: 'Invalid or expired token' },
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
    console.error('Profile API error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
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

export async function OPTIONS() {
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