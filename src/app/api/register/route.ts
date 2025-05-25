import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { createUser, isEmailExists } from '@/lib/userStore';
import { generateToken } from '@/lib/auth';
import { createSuccessResponse, createValidationErrorResponse, createErrorResponse } from '@/lib/api-response';
import { createOptionsResponse } from '@/lib/cors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, confirmPassword } = body;

    // 입력 검증
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return createValidationErrorResponse('모든 필수 필드를 입력해주세요.');
    }

    if (password !== confirmPassword) {
      return createValidationErrorResponse('비밀번호가 일치하지 않습니다.');
    }

    if (password.length < 8) {
      return createValidationErrorResponse('비밀번호는 8자 이상이어야 합니다.');
    }

    // 이메일 중복 확인
    const emailExists = await isEmailExists(email);
    if (emailExists) {
      return createValidationErrorResponse('이미 사용 중인 이메일입니다.');
    }

    // 비밀번호 해시화
    const hashedPassword = await bcrypt.hash(password, 12);

    // 새 사용자 생성
    const newUser = await createUser({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'user'
    });

    console.log('🎉 새 사용자 등록 완료:', email);

    // JWT 토큰 생성
    const token = generateToken(newUser);

    // 응답에서 비밀번호 제외
    const { password: _, ...userResponse } = newUser;

    return createSuccessResponse({
      message: '회원가입이 완료되었습니다.',
      user: userResponse,
      token
    }, '회원가입이 완료되었습니다.', 201);

  } catch (error) {
    console.error('회원가입 오류:', error);
    return createErrorResponse('서버 오류가 발생했습니다.');
  }
}

export async function OPTIONS(_request: NextRequest) {
  return createOptionsResponse();
} 