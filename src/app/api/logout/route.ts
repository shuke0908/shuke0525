import { NextRequest } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';
import { createOptionsResponse } from '@/lib/cors';
import { getCookieOptions, getUserIdCookieOptions } from '@/lib/auth';

export async function POST(_request: NextRequest) {
  console.log('🚪 Logout request via App Router');

  try {
    const response = createSuccessResponse({
      message: 'Logout successful'
    }, 'Logout successful');

    // 모든 인증 쿠키 제거 (크로스 오리진 지원)
    response.cookies.set('authToken', '', {
      ...getCookieOptions(),
      maxAge: 0, // 즉시 만료
    });

    response.cookies.set('userId', '', {
      ...getUserIdCookieOptions(),
      maxAge: 0, // 즉시 만료
    });

    // express-session 호환성을 위한 쿠키 제거
    response.cookies.set('connect.sid', '', {
      ...getCookieOptions(),
      maxAge: 0,
    });

    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return createErrorResponse('Internal server error during logout');
  }
}

export async function OPTIONS(_request: NextRequest) {
  return createOptionsResponse();
} 