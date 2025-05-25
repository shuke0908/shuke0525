import { NextRequest } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth';
import { createSuccessResponse, createAuthErrorResponse, createErrorResponse } from '@/lib/api-response';
import { createOptionsResponse } from '@/lib/cors';

export async function GET(request: NextRequest) {
  console.log('👤 /me API 요청');

  try {
    // 인증된 사용자 정보 가져오기
    const user = getAuthenticatedUser(request);
    
    if (!user) {
      return createAuthErrorResponse('인증 토큰이 없거나 유효하지 않습니다.');
    }

    // 비밀번호 제외하고 응답
    const { password: _, ...userResponse } = user;

    return createSuccessResponse({
      user: {
        ...userResponse,
        balance: userResponse.balance || '0.00',
        vipLevel: userResponse.vipLevel || 'bronze',
        kycStatus: userResponse.kycStatus || 'pending',
        isTwoFactorEnabled: userResponse.isTwoFactorEnabled || false
      }
    });

  } catch (error) {
    console.error('/me API 오류:', error);
    return createErrorResponse('서버 오류가 발생했습니다.');
  }
}

export async function OPTIONS(_request: NextRequest) {
  return createOptionsResponse();
} 