# IV. 실시간 통신 시스템

## 1. 개요

### 1.1 시스템 구조
- WebSocket 기반 실시간 통신
- Socket.IO 라이브러리 활용
- Redis Pub/Sub 메시징 시스템

### 1.2 주요 기능
- 실시간 가격 업데이트
- 거래 알림
- 실시간 차트 데이터
- 시스템 상태 모니터링

## 2. WebSocket 서버 구성

### 2.1 서버 설정
```typescript
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Redis } from 'ioredis';

const io = new Server({
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL,
    methods: ["GET", "POST"]
  }
});

const pubClient = new Redis(process.env.REDIS_URL);
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### 2.2 이벤트 핸들러
```typescript
io.on('connection', (socket) => {
  // 사용자 인증
  socket.on('authenticate', async (token) => {
    const user = await verifyToken(token);
    if (user) {
      socket.join(`user:${user.id}`);
      socket.emit('authenticated');
    }
  });

  // 실시간 가격 구독
  socket.on('subscribe:price', (symbol) => {
    socket.join(`price:${symbol}`);
  });

  // 거래 알림 구독
  socket.on('subscribe:trades', (symbol) => {
    socket.join(`trades:${symbol}`);
  });
});
```

## 3. 클라이언트 구현

### 3.1 Socket.IO 클라이언트 설정
```typescript
import { io } from 'socket.io-client';

const socket = io(process.env.NEXT_PUBLIC_WS_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000
});
```

### 3.2 연결 관리
```typescript
export const useSocket = () => {
  useEffect(() => {
    socket.connect();
    
    socket.on('connect', () => {
      console.log('WebSocket connected');
      socket.emit('authenticate', getAuthToken());
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return socket;
};
```

## 4. 실시간 데이터 처리

### 4.1 가격 업데이트
```typescript
// 서버
const updatePrice = (symbol: string, price: number) => {
  io.to(`price:${symbol}`).emit('price:update', { symbol, price });
};

// 클라이언트
socket.on('price:update', ({ symbol, price }) => {
  setPrices(prev => ({
    ...prev,
    [symbol]: price
  }));
});
```

### 4.2 거래 알림
```typescript
// 서버
const notifyTrade = (trade: Trade) => {
  io.to(`trades:${trade.symbol}`).emit('trade:new', trade);
};

// 클라이언트
socket.on('trade:new', (trade) => {
  addTrade(trade);
  showNotification(`New trade: ${trade.amount} ${trade.symbol}`);
});
```

## 5. 성능 최적화

### 5.1 메시지 배치 처리
```typescript
let priceUpdates = new Map();

setInterval(() => {
  if (priceUpdates.size > 0) {
    io.emit('price:batch', Array.from(priceUpdates));
    priceUpdates.clear();
  }
}, 100);
```

### 5.2 연결 상태 모니터링
```typescript
// 서버
const monitor = setInterval(() => {
  const metrics = {
    connections: io.engine.clientsCount,
    memory: process.memoryUsage(),
    uptime: process.uptime()
  };
  io.to('admin').emit('metrics', metrics);
}, 5000);

// 클라이언트
socket.on('metrics', (metrics) => {
  updateMetrics(metrics);
});
```

## 6. 에러 처리

### 6.1 재연결 로직
```typescript
socket.io.on('reconnect_attempt', (attempt) => {
  console.log(`Reconnection attempt ${attempt}`);
  if (attempt > 10) {
    socket.io.opts.reconnection = false;
    showError('WebSocket connection failed');
  }
});
```

### 6.2 에러 핸들링
```typescript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  showError('Connection error occurred');
});

socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
  showError('Failed to connect to server');
});
```

## 7. 보안

### 7.1 인증 미들웨어
```typescript
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    const user = await verifyToken(token);
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});
```

### 7.2 Rate Limiting
```typescript
const rateLimiter = new Map();

socket.use(([event, ...args], next) => {
  const key = `${socket.id}:${event}`;
  const now = Date.now();
  const limit = getRateLimit(event);
  
  if (rateLimiter.has(key)) {
    const { count, timestamp } = rateLimiter.get(key);
    if (now - timestamp < 1000 && count >= limit) {
      return next(new Error('Rate limit exceeded'));
    }
  }
  
  rateLimiter.set(key, {
    count: (rateLimiter.get(key)?.count || 0) + 1,
    timestamp: now
  });
  
  next();
});
```

## 8. 모니터링 및 로깅

### 8.1 로깅 설정
```typescript
const log = (level: string, message: string, meta?: any) => {
  const timestamp = new Date().toISOString();
  console.log(JSON.stringify({
    timestamp,
    level,
    message,
    ...meta
  }));
};

socket.on('connect', () => {
  log('info', 'Client connected', { id: socket.id });
});
```

### 8.2 성능 메트릭
```typescript
const collectMetrics = () => {
  const metrics = {
    connections: io.engine.clientsCount,
    rooms: io.sockets.adapter.rooms.size,
    events: eventCount,
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
  };
  
  prometheusRegistry.gauge('websocket_connections').set(metrics.connections);
  prometheusRegistry.gauge('websocket_rooms').set(metrics.rooms);
  prometheusRegistry.counter('websocket_events').inc(eventCount);
  
  return metrics;
};
```

## 9. 확장성 고려사항

### 9.1 수평적 확장
- Redis Pub/Sub을 통한 다중 서버 간 메시지 동기화
- Sticky Sessions을 통한 연결 유지
- 로드 밸런서 설정

### 9.2 성능 최적화
- 메시지 배치 처리
- 불필요한 업데이트 필터링
- 연결 풀링

## 10. 테스트

### 10.1 단위 테스트
```typescript
describe('WebSocket Server', () => {
  let socket;
  
  beforeEach((done) => {
    socket = io.connect(process.env.NEXT_PUBLIC_WS_URL);
    socket.on('connect', done);
  });
  
  afterEach(() => {
    socket.disconnect();
  });
  
  it('should authenticate with valid token', (done) => {
    socket.emit('authenticate', validToken);
    socket.on('authenticated', () => {
      done();
    });
  });
});
```

### 10.2 부하 테스트
```typescript
const loadTest = async () => {
  const clients = [];
  for (let i = 0; i < 1000; i++) {
    const client = io.connect(process.env.NEXT_PUBLIC_WS_URL);
    clients.push(client);
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  return clients;
};
``` 