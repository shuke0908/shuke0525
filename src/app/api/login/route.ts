import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { findUserByEmail, getAllUsers, type User } from '@/lib/userStore';
import { generateToken, getCookieOptions, getUserIdCookieOptions } from '@/lib/auth';
import { createSuccessResponse, createValidationErrorResponse, createAuthErrorResponse, createErrorResponse } from '@/lib/api-response';
import { createOptionsResponse } from '@/lib/cors';

export async function POST(request: NextRequest) {
  console.log('🔐 Login attempt via App Router');
  
  try {
    const body = await request.json();
    const { email, password } = body;
    
    console.log(`Login attempt for email: ${email}`);
    const allUsers = await getAllUsers();
    console.log(`현재 등록된 사용자 수: ${allUsers.length}`);
    
    // 입력 검증
    if (!email || !password) {
      return createValidationErrorResponse('이메일과 비밀번호를 입력해주세요.');
    }

    // Supabase에서 사용자 찾기
    const user: User | null = await findUserByEmail(email);
    
    if (!user) {
      console.log(`❌ 사용자를 찾을 수 없음: ${email}`);
      return createAuthErrorResponse('사용자를 찾을 수 없습니다.');
    }

    console.log(`✅ 사용자 발견: ${user.firstName} ${user.lastName}`);

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log(`❌ 비밀번호 불일치: ${email}`);
      return createAuthErrorResponse('비밀번호가 올바르지 않습니다.');
    }

    console.log(`🎉 로그인 성공: ${email}`);

    // JWT 토큰 생성
    const authToken = generateToken(user);

    const response = createSuccessResponse({
      message: '로그인 성공',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        authToken: authToken
      }
    });

    // 세션 쿠키 설정
    response.cookies.set('authToken', authToken, getCookieOptions());

    // 사용자 ID 쿠키 설정
    response.cookies.set('userId', user.id, getUserIdCookieOptions());

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return createErrorResponse('서버 오류가 발생했습니다.');
  }
}

export async function OPTIONS(_request: NextRequest) {
  return createOptionsResponse();
} 