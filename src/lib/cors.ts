/**
 * CORS 헤더 관리 유틸리티
 * 모든 API에서 일관된 CORS 설정을 사용하기 위한 중앙 관리
 */

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true',
} as const;

/**
 * API 응답에 CORS 헤더를 추가하는 헬퍼 함수
 */
export function withCors(headers: Record<string, string> = {}): Record<string, string> {
  return {
    ...CORS_HEADERS,
    ...headers,
  };
}

/**
 * OPTIONS 요청에 대한 표준 응답
 */
export function createOptionsResponse() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
} 