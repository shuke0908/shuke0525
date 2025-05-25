import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // JWT 토큰 검증
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  
  if (!token) {
    return new Response('Unauthorized', { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return new Response('Invalid token', { status: 401 });
  }

  // SSE 스트림 생성
  const stream = new ReadableStream({
    start(controller) {
      // 연결 확인 메시지
      const encoder = new TextEncoder();
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'connected',
        userId: decoded.userId,
        timestamp: new Date().toISOString()
      })}\n\n`));

      // 주기적으로 heartbeat 전송
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'heartbeat',
            timestamp: new Date().toISOString()
          })}\n\n`));
        } catch (error) {
          clearInterval(heartbeatInterval);
        }
      }, 30000); // 30초마다

      // 클라이언트 연결 해제 시 정리
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeatInterval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Flash Trade 업데이트 브로드캐스트 함수 (다른 API에서 호출)
export async function broadcastFlashTradeUpdate(tradeId: string, update: any) {
  // 실제 구현에서는 Redis나 다른 pub/sub 시스템을 사용해야 함
  // 여기서는 간단한 로깅만 수행
  console.log(`📡 Flash Trade 업데이트 브로드캐스트: ${tradeId}`, update);
  
  // TODO: 실제 클라이언트들에게 메시지 전송
  // 이는 Redis Pub/Sub이나 다른 실시간 메시징 시스템이 필요함
} 