import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/supabase';

export const runtime = 'nodejs';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('🔐 Login attempt:', { email, password: password ? '[REDACTED]' : 'undefined' });

    if (!email || !password) {
      console.log('❌ Missing email or password');
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }



    // 임시 하드코딩된 사용자 데이터 (환경변수가 없을 때)
    const hardcodedUsers = [
      {
        id: 'super-admin-001',
        email: 'shuke0525@jjk.app',
        password: '$2b$12$DQpQ6URP1YYqt7O.U3EHsuhh9yIapcAV0iBCKNaJ4goxLnySkHJe6', // michael112
        firstName: 'Super',
        lastName: 'Admin',
        nickname: 'SuperAdmin',
        role: 'superadmin',
        balance: '1000000.00',
        vipLevel: 10,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test-user-001',
        email: 'test@jjk.app',
        password: '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // test123
        firstName: 'Test',
        lastName: 'User',
        nickname: 'TestUser',
        role: 'user',
        balance: '10000.00',
        vipLevel: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // 하드코딩된 사용자에서 찾기
    let user = hardcodedUsers.find(u => u.email === email);

    // Supabase가 설정되어 있다면 데이터베이스에서도 조회
    if (!user && supabaseAdmin) {
      try {
        const { data: dbUser, error } = await supabaseAdmin
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
        
        if (!error && dbUser) {
          user = dbUser;
        }
      } catch (dbError) {
        console.log('Database query failed, using hardcoded users only');
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const accessToken = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 사용자 정보 (비밀번호 제외)
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      tokens: {
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ authenticated: false }, { status: 200 });
}

/**
 * OPTIONS 요청 처리 (CORS)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 