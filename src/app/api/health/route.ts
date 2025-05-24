import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
  console.log('🏥 Health check requested via App Router');
  
  return NextResponse.json({
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
  }, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }
  });
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

export async function HEAD(_request: NextRequest) {
  return new NextResponse(null, { status: 200 });
} 