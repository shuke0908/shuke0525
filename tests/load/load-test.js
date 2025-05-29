// Artillery.js 부하 테스트 설정

const scenarios = {
  // 기본 페이지 접근 시나리오
  homepage_load: {
    weight: 30,
    flow: [
      { get: { url: "/" } },
      { think: 2 },
      { get: { url: "/api/health" } }
    ]
  },

  // 트레이딩 페이지 시나리오
  trading_flow: {
    weight: 40,
    flow: [
      { get: { url: "/" } },
      { think: 1 },
      { get: { url: "/trading" } },
      { think: 3 },
      { get: { url: "/api/market/prices" } },
      { think: 2 },
      { post: { 
          url: "/api/orders", 
          json: {
            symbol: "BTC/USD",
            amount: 0.01,
            type: "buy",
            price: 50000
          }
        }
      }
    ]
  },

  // 포트폴리오 조회 시나리오
  portfolio_view: {
    weight: 20,
    flow: [
      { get: { url: "/" } },
      { think: 1 },
      { get: { url: "/portfolio" } },
      { think: 2 },
      { get: { url: "/api/portfolio/summary" } },
      { get: { url: "/api/portfolio/history" } }
    ]
  },

  // 실시간 데이터 시나리오
  realtime_data: {
    weight: 10,
    flow: [
      { get: { url: "/trading" } },
      { think: 1 },
      { get: { url: "/api/market/ticker" } },
      { think: 0.5 },
      { get: { url: "/api/market/ticker" } },
      { think: 0.5 },
      { get: { url: "/api/market/ticker" } },
      { think: 0.5 },
      { get: { url: "/api/market/ticker" } }
    ]
  }
};

// 각기 다른 부하 레벨별 설정
const loadTests = {
  // 경부하 테스트 (일반적인 사용량)
  light: {
    target: process.env.TEST_TARGET || 'http://localhost:3000',
    phases: [
      { duration: '2m', arrivalRate: 5 },  // 2분간 초당 5명
      { duration: '5m', arrivalRate: 10 }, // 5분간 초당 10명
      { duration: '2m', arrivalRate: 5 }   // 2분간 초당 5명 (cool down)
    ],
    scenarios
  },

  // 중부하 테스트 (피크 시간대)
  medium: {
    target: process.env.TEST_TARGET || 'http://localhost:3000',
    phases: [
      { duration: '3m', arrivalRate: 10 }, // 3분간 초당 10명
      { duration: '10m', arrivalRate: 25 }, // 10분간 초당 25명
      { duration: '5m', arrivalRate: 50 },  // 5분간 초당 50명
      { duration: '3m', arrivalRate: 10 }   // 3분간 초당 10명 (cool down)
    ],
    scenarios
  },

  // 고부하 테스트 (스트레스 테스트)
  heavy: {
    target: process.env.TEST_TARGET || 'http://localhost:3000',
    phases: [
      { duration: '5m', arrivalRate: 20 },  // 5분간 초당 20명
      { duration: '10m', arrivalRate: 50 }, // 10분간 초당 50명
      { duration: '10m', arrivalRate: 100 }, // 10분간 초당 100명
      { duration: '5m', arrivalRate: 50 },  // 5분간 초당 50명
      { duration: '5m', arrivalRate: 20 }   // 5분간 초당 20명 (cool down)
    ],
    scenarios
  },

  // 스파이크 테스트 (급격한 트래픽 증가)
  spike: {
    target: process.env.TEST_TARGET || 'http://localhost:3000',
    phases: [
      { duration: '2m', arrivalRate: 10 },  // 2분간 초당 10명 (baseline)
      { duration: '1m', arrivalRate: 200 }, // 1분간 초당 200명 (spike)
      { duration: '5m', arrivalRate: 10 },  // 5분간 초당 10명 (recovery)
      { duration: '1m', arrivalRate: 200 }, // 1분간 초당 200명 (spike)
      { duration: '2m', arrivalRate: 10 }   // 2분간 초당 10명 (cool down)
    ],
    scenarios
  }
};

// 커스텀 함수들
function generateRandomTrade() {
  const symbols = ['BTC/USD', 'ETH/USD', 'LTC/USD', 'ADA/USD'];
  const types = ['buy', 'sell'];
  
  return {
    symbol: symbols[Math.floor(Math.random() * symbols.length)],
    amount: (Math.random() * 10).toFixed(4),
    type: types[Math.floor(Math.random() * types.length)],
    price: Math.floor(Math.random() * 100000) + 10000
  };
}

function logResponse(requestParams, response, context, next) {
  console.log(`${requestParams.method} ${requestParams.url} - ${response.statusCode}`);
  
  // 응답 시간 로깅
  if (response.timings) {
    console.log(`Response time: ${response.timings.response}ms`);
  }
  
  // 에러 상태 코드 감지
  if (response.statusCode >= 400) {
    console.error(`Error response: ${response.statusCode} ${response.statusMessage}`);
  }
  
  return next();
}

function validateResponse(requestParams, response, context, next) {
  // 응답 시간 검증 (5초 초과 시 실패)
  if (response.timings && response.timings.response > 5000) {
    console.error(`Slow response detected: ${response.timings.response}ms`);
  }
  
  // 성공 응답 검증
  if (response.statusCode < 200 || response.statusCode >= 400) {
    console.error(`Failed request: ${requestParams.url} - ${response.statusCode}`);
  }
  
  return next();
}

// 성능 메트릭 수집
function collectMetrics(requestParams, response, context, next) {
  if (!context.vars.metrics) {
    context.vars.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0
    };
  }
  
  context.vars.metrics.totalRequests++;
  
  if (response.statusCode >= 200 && response.statusCode < 400) {
    context.vars.metrics.successfulRequests++;
  } else {
    context.vars.metrics.failedRequests++;
  }
  
  if (response.timings) {
    context.vars.metrics.totalResponseTime += response.timings.response;
  }
  
  return next();
}

// WebSocket 연결 테스트
function testWebSocket(context, next) {
  // WebSocket 연결 시뮬레이션 (실제 구현 시 ws 라이브러리 사용)
  console.log('WebSocket connection test...');
  
  // 실시간 가격 업데이트 시뮬레이션
  setTimeout(() => {
    console.log('WebSocket connection established');
    next();
  }, 100);
}

// 모바일 사용자 시뮬레이션
function simulateMobileUser(context, next) {
  // 모바일 사용자 헤더 설정
  context.vars.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15';
  context.vars.viewport = 'mobile';
  
  return next();
}

// 인증된 사용자 시뮬레이션
function simulateAuthenticatedUser(context, next) {
  // 가상의 JWT 토큰 설정
  context.vars.authToken = 'Bearer mock-jwt-token-' + Math.random().toString(36).substr(2, 9);
  
  return next();
}

module.exports = {
  loadTests,
  scenarios,
  utils: {
    generateRandomTrade,
    logResponse,
    validateResponse,
    collectMetrics,
    testWebSocket,
    simulateMobileUser,
    simulateAuthenticatedUser
  }
}; 