import { NextRequest } from 'next/server';
import { findUserByEmail } from '@/lib/userStore';
import { createSuccessResponse, createValidationErrorResponse, createErrorResponse } from '@/lib/api-response';
import { createOptionsResponse } from '@/lib/cors';

export async function POST(request: NextRequest) {
  console.log('🔑 비밀번호 찾기 요청');

  try {
    const body = await request.json();
    const { email } = body;

    // 입력 검증
    if (!email) {
      return createValidationErrorResponse('이메일을 입력해주세요.');
    }

    // 사용자 존재 확인
    const user = findUserByEmail(email);

    // 보안상 이유로 사용자 존재 여부와 관계없이 성공 응답
    // 실제로는 이메일이 존재할 경우에만 리셋 링크를 발송
    if (user) {
      console.log(`📧 비밀번호 리셋 링크 발송 예정: ${email}`);
      // 실제 구현에서는 여기서 이메일 발송 로직 추가
    }

    return createSuccessResponse({
      message: '비밀번호 재설정 링크가 이메일로 전송되었습니다. (이메일이 존재하는 경우)'
    }, '비밀번호 재설정 링크가 이메일로 전송되었습니다.');

  } catch (error) {
    console.error('비밀번호 찾기 오류:', error);
    return createErrorResponse('서버 오류가 발생했습니다.');
  }
}

export async function OPTIONS(_request: NextRequest) {
  return createOptionsResponse();
} 