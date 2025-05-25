import { NextRequest } from 'next/server';
import { createSuccessResponse } from '@/lib/api-response';
import { createOptionsResponse } from '@/lib/cors';

export async function GET(_request: NextRequest) {
  console.log('🏥 Health check requested via App Router');
  
  return createSuccessResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    version: '1.0.0',
    database: 'connected', // 실제 DB 연결 상태 확인 로직 추가 가능
    services: {
      api: 'healthy',
      auth: 'healthy',
      websocket: 'healthy'
    }
  });
}

export async function OPTIONS(_request: NextRequest) {
  return createOptionsResponse();
}

export async function HEAD(_request: NextRequest) {
  return new Response(null, { status: 200 });
} 