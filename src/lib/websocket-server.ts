import { WebSocketServer, WebSocket } from 'ws';
import { verifyToken } from './auth';

// 사용자 연결 관리
const userConnections = new Map<string, WebSocket>();
const adminConnections = new Set<WebSocket>();

// WebSocket 서버 인스턴스
let wss: WebSocketServer | null = null;

// WebSocket 서버 시작
export function startWebSocketServer(port: number = 8082) {
  if (wss) {
    console.log('⚠️ WebSocket server already running');
    return wss;
  }

  wss = new WebSocketServer({ 
    port,
    verifyClient: (info) => {
      // 기본적으로 모든 연결 허용 (인증은 메시지 레벨에서 처리)
      return true;
    }
  });

  console.log(`🚀 WebSocket server started on port ${port}`);

  wss.on('connection', (ws, request) => {
    console.log('🔌 New WebSocket connection');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleWebSocketMessage(ws, message);
      } catch (error) {
        console.error('❌ WebSocket message error:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: '잘못된 메시지 형식입니다.'
        }));
      }
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
      // 연결 정리
      cleanupConnection(ws);
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
      cleanupConnection(ws);
    });

    // 연결 확인 메시지
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'WebSocket 연결이 성공했습니다.'
    }));
  });

  return wss;
}

// WebSocket 메시지 처리
async function handleWebSocketMessage(ws: WebSocket, message: any) {
  const { type, token, userId, data } = message;

  switch (type) {
    case 'subscribe_user':
      await handleUserSubscription(ws, token, userId);
      break;

    case 'subscribe_admin':
      await handleAdminSubscription(ws, token);
      break;

    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;

    default:
      ws.send(JSON.stringify({
        type: 'error',
        message: `알 수 없는 메시지 타입: ${type}`
      }));
  }
}

// 사용자 구독 처리
async function handleUserSubscription(ws: WebSocket, token: string, userId: string) {
  try {
    if (!token) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '인증 토큰이 필요합니다.'
      }));
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.id !== userId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '유효하지 않은 토큰입니다.'
      }));
      return;
    }

    // 기존 연결이 있다면 제거
    if (userConnections.has(userId)) {
      const oldWs = userConnections.get(userId);
      if (oldWs && oldWs.readyState === WebSocket.OPEN) {
        oldWs.close();
      }
    }

    // 새 연결 등록
    userConnections.set(userId, ws);
    
    console.log(`✅ User ${decoded.email} subscribed to WebSocket`);

    ws.send(JSON.stringify({
      type: 'subscribed',
      message: '사용자 구독이 완료되었습니다.'
    }));

  } catch (error) {
    console.error('❌ User subscription error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '구독 처리 중 오류가 발생했습니다.'
    }));
  }
}

// 관리자 구독 처리
async function handleAdminSubscription(ws: WebSocket, token: string) {
  try {
    if (!token) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '인증 토큰이 필요합니다.'
      }));
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      ws.send(JSON.stringify({
        type: 'error',
        message: '관리자 권한이 필요합니다.'
      }));
      return;
    }

    // 관리자 연결 등록
    adminConnections.add(ws);
    
    console.log(`✅ Admin ${decoded.email} subscribed to WebSocket`);

    ws.send(JSON.stringify({
      type: 'subscribed',
      message: '관리자 구독이 완료되었습니다.'
    }));

  } catch (error) {
    console.error('❌ Admin subscription error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '관리자 구독 처리 중 오류가 발생했습니다.'
    }));
  }
}

// 연결 정리
function cleanupConnection(ws: WebSocket) {
  // 사용자 연결에서 제거
  for (const [userId, connection] of userConnections) {
    if (connection === ws) {
      userConnections.delete(userId);
      console.log(`🧹 Cleaned up user connection: ${userId}`);
      break;
    }
  }

  // 관리자 연결에서 제거
  if (adminConnections.has(ws)) {
    adminConnections.delete(ws);
    console.log('🧹 Cleaned up admin connection');
  }
}

// 거래 결과를 사용자에게 전송
export function notifyTradeResult(userId: string, result: any) {
  const ws = userConnections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'trade_result',
      data: result
    }));
    console.log(`📤 Trade result sent to user ${userId}`);
  } else {
    console.log(`⚠️ User ${userId} not connected to WebSocket`);
  }
}

// 관리자에게 거래 활동 알림
export function notifyAdminsTradeActivity(tradeData: any) {
  const message = JSON.stringify({
    type: 'trade_activity',
    data: tradeData
  });

  adminConnections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });

  console.log(`📤 Trade activity sent to ${adminConnections.size} admins`);
}

// 활성 거래 업데이트를 관리자에게 전송
export function notifyAdminsActiveTrades(activeTrades: any[]) {
  const message = JSON.stringify({
    type: 'active_trades_update',
    trades: activeTrades
  });

  adminConnections.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(message);
    }
  });

  console.log(`📤 Active trades update sent to ${adminConnections.size} admins`);
}

// 사용자 설정 변경을 해당 사용자에게 알림
export function notifyUserSettingsChange(userId: string, settings: any) {
  const ws = userConnections.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({
      type: 'settings_updated',
      data: settings
    }));
    console.log(`📤 Settings update sent to user ${userId}`);
  }
}

// WebSocket 서버 상태 확인
export function getWebSocketStatus() {
  return {
    isRunning: wss !== null,
    userConnections: userConnections.size,
    adminConnections: adminConnections.size,
    port: wss ? (wss.options as any).port : null
  };
}

// WebSocket 서버 종료
export function stopWebSocketServer() {
  if (wss) {
    wss.close();
    wss = null;
    userConnections.clear();
    adminConnections.clear();
    console.log('🛑 WebSocket server stopped');
  }
}

// 개발 환경에서 자동 시작
if (process.env.NODE_ENV === 'development') {
  const port = parseInt(process.env.WEBSOCKET_PORT || '8082');
  startWebSocketServer(port);
} 