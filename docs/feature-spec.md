# 📋 QuantTrade 기능 명세서

## 🎯 플랫폼 개요

QuantTrade는 **가상 거래 시뮬레이션 플랫폼**으로, 실제 거래소 연동 없이 관리자 설정 기반의 완전한 가상 거래 환경을 제공합니다.

### 🔑 핵심 원칙
- 🚫 **실제 거래소 연동 없음**: 외부 API 의존성 제거
- ✅ **관리자 완전 제어**: 모든 거래 결과는 관리자 설정에 의해 결정
- ✅ **무조건 성공하는 주문**: 사용자 주문은 항상 성공 처리
- ✅ **실시간 시뮬레이션**: WebSocket 기반 실시간 UI 업데이트

---

## 🔐 인증 시스템

### ✅ 구현 완료 기능

#### 1.1 JWT 기반 인증
- **Access Token**: 15분 유효기간
- **Refresh Token**: 7일 유효기간
- **자동 토큰 갱신**: 만료 전 자동 갱신
- **역할 기반 접근 제어**: user, admin, superadmin

```typescript
// 토큰 구조
interface AccessToken {
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  exp: number;
}
```

#### 1.2 미들웨어 보호
- **라우트 보호**: 인증 필요 페이지 자동 차단
- **권한 검증**: 역할별 접근 권한 확인
- **헤더 주입**: 사용자 정보를 API 헤더에 자동 주입

```typescript
// 보호된 라우트
const protectedRoutes = [
  '/dashboard/*',
  '/wallet/*', 
  '/admin/*',
  '/api/flash-trade/*',
  '/api/admin/*'
];
```

#### 1.3 개발 환경 테스트 계정
```typescript
// 기본 제공 계정
const testAccounts = [
  {
    email: 'admin@quanttrade.com',
    password: 'password123',
    role: 'superadmin',
    balance: 10000
  },
  {
    email: 'user@quanttrade.com', 
    password: 'password123',
    role: 'user',
    balance: 1000
  },
  {
    email: 'trader@quanttrade.com',
    password: 'password123', 
    role: 'admin',
    balance: 5000
  }
];
```

### 🔄 API 엔드포인트

#### POST `/api/auth/login`
```typescript
// 요청
{
  email: string;
  password: string;
}

// 응답
{
  success: boolean;
  user: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
```

---

## ⚡ FlashTrade 가상 거래 시스템

### ✅ 구현 완료 기능

#### 2.1 관리자 설정 시스템
완전한 관리자 제어 기반의 거래 결과 결정 시스템

```typescript
interface AdminSettings {
  id: string;
  userId?: string;              // null이면 전체 기본 설정
  winRate: number;              // 승률 (0-100%)
  maxProfitRate: number;        // 최대 수익률 (10-200%)
  forceResult?: 'win' | 'lose'; // 강제 결과 (승률 무시)
  minAmount: number;            // 최소 거래 금액
  maxAmount: number;            // 최대 거래 금액
  availableDurations: number[]; // 사용 가능한 거래 시간 (초)
  isActive: boolean;            // 서비스 활성화 여부
}
```

**기본 설정값:**
- 승률: 45%
- 수익률: 85%
- 거래 금액: $10 - $10,000
- 거래 시간: 30초, 60초, 120초, 300초

#### 2.2 거래 생성 시스템
사용자 주문이 무조건 성공하는 가상 거래 생성

**처리 과정:**
1. 사용자 인증 확인
2. 관리자 설정 조회 (`getFlashTradeSettings()`)
3. 설정 기반 유효성 검사
4. 잔액 확인 및 차감
5. 가상 가격 시뮬레이션 ($50,000-$60,000)
6. 거래 객체 생성 (무조건 성공)

```typescript
// 거래 생성 요청
POST /api/flash-trade/create
{
  amount: number;        // 거래 금액
  direction: 'up' | 'down'; // 예측 방향
  duration: number;      // 거래 시간 (초)
  symbol?: string;       // 거래 심볼 (기본: BTC/USDT)
}

// 응답
{
  success: true;
  trade: {
    id: string;
    amount: number;
    direction: string;
    entryPrice: number;
    potentialProfit: number;
    expiresAt: Date;
    status: 'active';
  };
}
```

#### 2.3 자동 완료 시스템
관리자 설정 기반 거래 결과 자동 결정

```typescript
// 결과 결정 로직
function determineTradeResult(trade, settings) {
  // 1. 강제 결과 우선 (승률 무시)
  if (settings.forceResult) {
    return settings.forceResult;
  }
  
  // 2. 승률 기반 랜덤 결정
  const random = Math.random() * 100;
  return random < settings.winRate ? 'win' : 'lose';
}

// 수익 계산
const profit = result === 'win' 
  ? amount * (maxProfitRate / 100)  // 승리: 수익률 적용
  : -amount;                        // 패배: 전액 손실
```

#### 2.4 거래 목록 및 통계
사용자별 거래 내역 및 실시간 통계 제공

```typescript
// 거래 목록 조회
GET /api/flash-trade/list?status=all&limit=50&offset=0

// 응답
{
  success: true;
  trades: FlashTrade[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  stats: {
    total: number;        // 총 거래수
    active: number;       // 활성 거래수
    completed: number;    // 완료 거래수
    wins: number;         // 승리 횟수
    losses: number;       // 패배 횟수
    totalProfit: number;  // 총 수익
    winRate: number;      // 실제 승률
  };
}
```

### 🔄 API 엔드포인트

#### 관리자 설정 API

##### GET `/api/admin/flash-trade-settings`
```typescript
// 쿼리 파라미터
?userId=string  // 특정 사용자 설정 조회 (선택사항)

// 응답
{
  success: boolean;
  settings: AdminSettings;
}
```

##### POST `/api/admin/flash-trade-settings`
```typescript
// 요청 (설정 업데이트)
{
  userId?: string;              // 특정 사용자 설정 (선택사항)
  winRate: number;              // 0-100
  maxProfitRate: number;        // 10-200
  forceResult?: 'win' | 'lose'; // 강제 결과
  minAmount: number;
  maxAmount: number;
  availableDurations: number[];
  isActive: boolean;
}
```

##### PUT `/api/admin/flash-trade-settings`
```typescript
// 모든 설정 조회 (관리자용)
{
  success: boolean;
  allSettings: AdminSettings[];
}
```

#### 거래 API

##### POST `/api/flash-trade/create`
거래 생성 (무조건 성공)

##### GET `/api/flash-trade/list`
사용자 거래 목록 조회

##### POST `/api/flash-trade/auto-complete`
만료된 거래 자동 완료 처리

---

## 🛡️ 관리자 시스템

### ✅ 구현 완료 기능

#### 3.1 FlashTrade 설정 관리 UI
완전한 관리자 인터페이스 제공

**주요 기능:**
- **탭 기반 UI**: 전체 기본 설정 / 사용자별 설정
- **실시간 설정 변경**: 즉시 적용되는 설정 업데이트
- **시각적 설정 도구**: 슬라이더, 토글, 배지 클릭 방식
- **설정 요약 대시보드**: 현재 설정값 시각화

**설정 가능 항목:**
- 승률 슬라이더 (0-100%)
- 수익률 슬라이더 (10-200%)
- 강제 결과 선택 (없음/항상 승리/항상 패배)
- 거래 금액 범위 설정
- 사용 가능한 거래 시간 선택 (Badge 클릭)
- 서비스 활성화 토글

#### 3.2 사용자별 개별 설정
특정 사용자에게만 적용되는 개별 설정 지원

```typescript
// 설정 우선순위
1. 사용자별 개별 설정 (최우선)
2. 전체 기본 설정 (fallback)
```

### 📊 관리자 대시보드 구성

#### 설정 요약 카드
```typescript
// 현재 설정 시각화
{
  winRate: "45%",           // 승률
  maxProfitRate: "85%",     // 수익률  
  amountRange: "$10-$10,000", // 거래 금액
  durations: "4개",         // 거래 시간 옵션
  forceResult?: "강제 승리"  // 강제 결과 (있는 경우)
}
```

#### 사용자별 설정 목록
- 개별 설정이 적용된 사용자 목록
- 각 사용자의 설정값 요약
- 활성/비활성 상태 표시
- 강제 결과 설정 여부 표시

---

## 💰 지갑 시스템

### ✅ 구현 완료 기능

#### 4.1 가상 잔액 시스템
개발 환경용 메모리 기반 잔액 관리

```typescript
// 기본 잔액 설정
const defaultBalances = {
  'admin@quanttrade.com': 10000,   // 관리자: $10,000
  'user@quanttrade.com': 1000,     // 일반 사용자: $1,000
  'trader@quanttrade.com': 5000    // 트레이더: $5,000
};
```

#### 4.2 잔액 처리 로직
```typescript
// 거래 생성 시
1. 잔액 확인 (amount <= balance)
2. 잔액 차감 (balance -= amount)
3. 거래 생성

// 거래 완료 시 (승리)
1. 원금 + 수익 반환 (balance += amount + profit)

// 거래 완료 시 (패배)
1. 추가 처리 없음 (이미 차감됨)
```

### 🔄 향후 구현 예정

#### 4.3 입출금 시스템
- 가상 입금 요청 시스템
- 관리자 승인 워크플로우
- 출금 요청 및 처리
- 거래 내역 상세 조회

---

## 🌐 WebSocket 실시간 통신

### ✅ 구현 완료 기능

#### 5.1 WebSocket 서버
Express.js 기반 독립 서버 (포트 8082)

```javascript
// 서버 구성
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});
```

#### 5.2 실시간 이벤트
```typescript
// 클라이언트 → 서버
{
  type: 'subscribe_trades',
  userId: string;
}

// 서버 → 클라이언트  
{
  type: 'trade_update',
  data: {
    tradeId: string;
    status: 'completed';
    result: 'win' | 'lose';
    profit: number;
    exitPrice: number;
  };
}
```

### 🔄 향후 구현 예정

#### 5.3 고급 실시간 기능
- 실시간 가격 시뮬레이션
- 관리자 액션 브로드캐스트
- 사용자별 개별 알림
- 시스템 상태 모니터링

---

## 📱 사용자 인터페이스

### ✅ 구현 완료 기능

#### 6.1 인증 UI
- **로그인 페이지**: 이메일/비밀번호 로그인
- **회원가입 페이지**: 기본 정보 입력
- **자동 리다이렉트**: 인증 상태에 따른 페이지 이동

#### 6.2 관리자 UI
- **설정 관리 페이지**: 완전한 FlashTrade 설정 인터페이스
- **탭 기반 네비게이션**: 전체 설정 / 사용자별 설정
- **실시간 설정 요약**: 현재 설정값 시각화
- **반응형 디자인**: 모바일/데스크톱 대응

#### 6.3 공통 UI 컴포넌트
- **shadcn/ui 기반**: 일관된 디자인 시스템
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **다크/라이트 모드**: 테마 전환 지원
- **토스트 알림**: 사용자 피드백 시스템

### 🔄 향후 구현 예정

#### 6.4 거래 UI
- FlashTrade 거래 모듈
- 실시간 차트 시스템
- 거래 내역 테이블
- 통계 대시보드

#### 6.5 지갑 UI
- 잔액 카드 컴포넌트
- 거래 내역 목록
- 입출금 폼
- 통계 차트

---

## 🔧 개발 도구 및 테스트

### ✅ 구현 완료 기능

#### 7.1 테스트 스크립트
완전한 시스템 테스트 자동화

```javascript
// test-flash-trade-system.js
- 관리자/사용자 로그인 테스트
- 설정 조회/변경 테스트  
- 거래 생성/목록 조회 테스트
- 자동 완료 테스트
- 승리/패배 시나리오 테스트
```

#### 7.2 개발 환경 설정
```json
{
  "scripts": {
    "dev": "next dev -p 3000",
    "ws:dev": "node server/websocket-server.js",
    "build": "next build",
    "start": "next start",
    "test": "node test-flash-trade-system.js"
  }
}
```

### 🔄 향후 구현 예정

#### 7.3 자동화 테스트
- Jest 기반 단위 테스트
- Playwright E2E 테스트
- API 통합 테스트
- 성능 테스트

---

## 📊 데이터 관리

### ✅ 구현 완료 기능

#### 8.1 메모리 기반 저장소
개발 환경용 임시 데이터 저장

```typescript
// 사용자 데이터
const developmentUsers = [
  { id: 'admin-1', email: 'admin@quanttrade.com', role: 'superadmin' },
  { id: 'user-1', email: 'user@quanttrade.com', role: 'user' },
  { id: 'trader-1', email: 'trader@quanttrade.com', role: 'admin' }
];

// 거래 데이터
let flashTrades: FlashTrade[] = [];

// 관리자 설정
let adminSettings: AdminSettings[] = [];
```

#### 8.2 데이터 일관성
- 거래 ID 자동 증가
- 사용자별 데이터 격리
- 설정 우선순위 관리

### 🔄 향후 구현 예정

#### 8.3 Supabase 연동
- PostgreSQL 테이블 생성
- 실시간 데이터 동기화
- 백업 및 복구 시스템
- 데이터 마이그레이션

---

## 🚀 배포 및 운영

### 🔄 향후 구현 예정

#### 9.1 Vercel 배포
- Next.js 앱 자동 배포
- 환경 변수 설정
- 도메인 연결
- SSL 인증서

#### 9.2 Supabase 설정
- 데이터베이스 스키마 생성
- 인증 설정
- API 키 관리
- 백업 정책

#### 9.3 모니터링
- 에러 추적 (Sentry)
- 성능 모니터링
- 사용자 분석
- 로그 관리

---

## 📈 성능 및 확장성

### 🔄 향후 구현 예정

#### 10.1 성능 최적화
- 코드 스플리팅
- 이미지 최적화
- CDN 적용
- 캐싱 전략

#### 10.2 확장성 고려사항
- 마이크로서비스 아키텍처
- 로드 밸런싱
- 데이터베이스 샤딩
- 큐 시스템

---

## 🛡️ 보안

### ✅ 구현 완료 기능

#### 11.1 기본 보안
- JWT 토큰 기반 인증
- 미들웨어 라우트 보호
- 역할 기반 접근 제어
- 입력 데이터 검증 (Zod)

### 🔄 향후 구현 예정

#### 11.2 고급 보안
- Rate Limiting
- CSRF 보호
- XSS 방지
- SQL Injection 방지
- 암호화 강화

---

## 📋 구현 상태 요약

### ✅ 완료된 기능 (Phase 1)
- [x] JWT 인증 시스템
- [x] FlashTrade 가상 거래 시스템
- [x] 관리자 설정 관리
- [x] WebSocket 서버
- [x] 기본 UI 컴포넌트
- [x] 테스트 스크립트
- [x] 개발 환경 설정

### 🔄 진행 중인 기능
- [ ] 사용자 거래 UI
- [ ] 지갑 시스템 UI
- [ ] 실시간 차트

### 📅 향후 계획 (Phase 2)
- [ ] Supabase 데이터베이스 연동
- [ ] Vercel 배포
- [ ] 고급 관리자 기능
- [ ] 모바일 최적화
- [ ] 성능 최적화 