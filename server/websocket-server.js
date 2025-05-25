const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.WEBSOCKET_PORT || 8082;

// HTTP 서버 생성
const server = http.createServer();

// WebSocket 서버 생성
const wss = new WebSocket.Server({ server });

// 연결된 클라이언트들을 저장
const clients = new Set();

// 실시간 가격 데이터 (시뮬레이션)
const priceData = {
  'BTC/USD': 43250.50,
  'ETH/USD': 2650.75,
  'XRP/USD': 0.62,
  'BNB/USD': 315.80,
  'USDT/USD': 1.00
};

// 가격 업데이트 시뮬레이션
function simulatePriceUpdates() {
  setInterval(() => {
    Object.keys(priceData).forEach(symbol => {
      // -0.5% ~ +0.5% 범위의 랜덤 변화
      const change = (Math.random() - 0.5) * 0.01;
      priceData[symbol] = priceData[symbol] * (1 + change);
      
      // 소수점 2자리로 반올림
      priceData[symbol] = Math.round(priceData[symbol] * 100) / 100;
    });

    // 모든 클라이언트에게 업데이트된 가격 전송
    const message = JSON.stringify({
      type: 'price_update',
      data: priceData,
      timestamp: new Date().toISOString()
    });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }, 1000); // 1초마다 업데이트
}

// Flash Trade 데이터 시뮬레이션
function simulateFlashTradeData() {
  setInterval(() => {
    const flashTradeData = {
      totalVolume: Math.floor(Math.random() * 1000000) + 500000,
      activeTrades: Math.floor(Math.random() * 100) + 50,
      successRate: Math.floor(Math.random() * 20) + 80, // 80-100%
      avgProfit: (Math.random() * 10 + 5).toFixed(2) // 5-15%
    };

    const message = JSON.stringify({
      type: 'flash_trade_update',
      data: flashTradeData,
      timestamp: new Date().toISOString()
    });

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }, 5000); // 5초마다 업데이트
}

// 클라이언트 연결 처리
wss.on('connection', (ws, req) => {
  console.log('New client connected from:', req.socket.remoteAddress);
  
  // 클라이언트를 목록에 추가
  clients.add(ws);

  // 연결 즉시 현재 가격 데이터 전송
  ws.send(JSON.stringify({
    type: 'price_update',
    data: priceData,
    timestamp: new Date().toISOString()
  }));

  // 메시지 수신 처리
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received message:', data);

      // 클라이언트 요청에 따른 응답
      switch (data.type) {
        case 'subscribe':
          ws.send(JSON.stringify({
            type: 'subscription_confirmed',
            symbols: data.symbols || Object.keys(priceData),
            timestamp: new Date().toISOString()
          }));
          break;
        
        case 'ping':
          ws.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }));
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });

  // 연결 종료 처리
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });

  // 에러 처리
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// 서버 시작
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
  
  // 가격 업데이트 시뮬레이션 시작
  simulatePriceUpdates();
  simulateFlashTradeData();
});

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  wss.close(() => {
    server.close(() => {
      process.exit(0);
    });
  });
});

module.exports = { wss, server }; 