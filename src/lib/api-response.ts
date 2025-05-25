import { NextResponse } from 'next/server';
import { withCors } from './cors';

/**
 * 표준화된 API 응답 타입
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  timestamp: string;
}

/**
 * 성공 응답 생성
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
  
  if (message) {
    response.message = message;
  }

  return NextResponse.json(response, {
    status,
    headers: withCors(),
  });
}

/**
 * 오류 응답 생성
 */
export function createErrorResponse(
  error: string,
  status: number = 500,
  additionalHeaders: Record<string, string> = {}
): NextResponse<ApiResponse> {
  return NextResponse.json(
    {
      success: false,
      error,
      timestamp: new Date().toISOString(),
    },
    {
      status,
      headers: withCors(additionalHeaders),
    }
  );
}

/**
 * 인증 오류 응답
 */
export function createAuthErrorResponse(message: string = '인증이 필요합니다.'): NextResponse<ApiResponse> {
  return createErrorResponse(message, 401);
}

/**
 * 유효성 검사 오류 응답
 */
export function createValidationErrorResponse(message: string): NextResponse<ApiResponse> {
  return createErrorResponse(message, 400);
}

/**
 * 리소스 없음 오류 응답
 */
export function createNotFoundErrorResponse(message: string = '리소스를 찾을 수 없습니다.'): NextResponse<ApiResponse> {
  return createErrorResponse(message, 404);
} 