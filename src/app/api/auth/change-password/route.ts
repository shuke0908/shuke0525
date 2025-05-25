import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAuthenticatedUser } from '@/lib/auth';
import { createSuccessResponse, createValidationErrorResponse, createAuthErrorResponse, createErrorResponse } from '@/lib/api-response';
import { createOptionsResponse } from '@/lib/cors';

export async function POST(request: NextRequest) {
  console.log('🔐 비밀번호 변경 요청');

  try {
    // 인증 확인
    const user = getAuthenticatedUser(request);
    
    if (!user) {
      return createAuthErrorResponse('인증 토큰이 없거나 유효하지 않습니다.');
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmNewPassword } = body;

    // 입력 검증
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return createValidationErrorResponse('모든 필드를 입력해주세요.');
    }

    if (newPassword !== confirmNewPassword) {
      return createValidationErrorResponse('새 비밀번호가 일치하지 않습니다.');
    }

    if (newPassword.length < 8) {
      return createValidationErrorResponse('새 비밀번호는 8자 이상이어야 합니다.');
    }

    // 현재 비밀번호 확인
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return createValidationErrorResponse('현재 비밀번호가 올바르지 않습니다.');
    }

    // 새 비밀번호 해시화 및 저장
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;

    console.log(`✅ 비밀번호 변경 완료: ${user.email}`);

    return createSuccessResponse({
      message: '비밀번호가 성공적으로 변경되었습니다.'
    }, '비밀번호가 성공적으로 변경되었습니다.');

  } catch (error) {
    console.error('비밀번호 변경 오류:', error);
    return createErrorResponse('서버 오류가 발생했습니다.');
  }
}

export async function OPTIONS(_request: NextRequest) {
  return createOptionsResponse();
} 