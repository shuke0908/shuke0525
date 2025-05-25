const { WebSocketServer } = require('ws');
const jwt = require('jsonwebtoken');

// 환경 변수 로드
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const PORT = process.env.WEBSOCKET_PORT || 8082;

// 사용자 연결 관리
const userConnections = new Map();
const adminConnections = new Set();

// JWT 토큰 검증
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// WebSocket 서버 생성
const wss = new WebSocketServer({ 
  port: PORT,
  verifyClient: (info) => {
    return true; // 기본적으로 모든 연결 허용
  }
});

console.log(`🚀 WebSocket server started on port ${PORT}`);

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

// WebSocket 메시지 처리
async function handleWebSocketMessage(ws, message) {
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
async function handleUserSubscription(ws, token, userId) {
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
      if (oldWs && oldWs.readyState === 1) { // WebSocket.OPEN
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
async function handleAdminSubscription(ws, token) {
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
function cleanupConnection(ws) {
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

// HTTP API for external notifications
const http = require('http');
const url = require('url');

const httpServer = http.createServer((req, res) => {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    const parsedUrl = url.parse(req.url, true);
    
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        if (parsedUrl.pathname === '/notify-trade-result') {
          notifyTradeResult(data.userId, data.result);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else if (parsedUrl.pathname === '/notify-admin-activity') {
          notifyAdminsTradeActivity(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(404);
          res.end('Not Found');
        }
      } catch (error) {
        console.error('HTTP API error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
  } else {
    res.writeHead(405);
    res.end('Method Not Allowed');
  }
});

const HTTP_PORT = parseInt(PORT) + 1;
httpServer.listen(HTTP_PORT, () => {
  console.log(`📡 WebSocket HTTP API listening on port ${HTTP_PORT}`);
});

// 거래 결과를 사용자에게 전송
function notifyTradeResult(userId, result) {
  const ws = userConnections.get(userId);
  if (ws && ws.readyState === 1) { // WebSocket.OPEN
    ws.send(JSON.stringify({
      type: 'trade_result',
      data: result
    }));
    console.log(`📤 Trade result sent to user ${userId}`);
    return true;
  } else {
    console.log(`⚠️ User ${userId} not connected to WebSocket`);
    return false;
  }
}

// 관리자에게 거래 활동 알림
function notifyAdminsTradeActivity(tradeData) {
  const message = JSON.stringify({
    type: 'trade_activity',
    data: tradeData
  });

  let sentCount = 0;
  adminConnections.forEach(ws => {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(message);
      sentCount++;
    }
  });

  console.log(`📤 Trade activity sent to ${sentCount} admins`);
  return sentCount;
}

// 상태 확인 엔드포인트
httpServer.on('request', (req, res) => {
  if (req.url === '/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'running',
      userConnections: userConnections.size,
      adminConnections: adminConnections.size,
      port: PORT,
      httpPort: HTTP_PORT
    }));
  }
});

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down WebSocket server...');
  wss.close();
  httpServer.close();
  process.exit(0);
});

console.log(`📊 WebSocket server status:`);
console.log(`   - WebSocket port: ${PORT}`);
console.log(`   - HTTP API port: ${HTTP_PORT}`);
console.log(`   - Ready to accept connections!`); 