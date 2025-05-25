# 🏗️ QuantTrade 플랫폼 아키텍처

## 📋 프로젝트 개요

QuantTrade는 **완전한 가상 거래 시뮬레이션 플랫폼**입니다. 실제 거래소 연동이 아닌 관리자 설정 기반의 가상 거래 환경을 제공합니다.

### 🎯 핵심 특징
- ✅ **가상 거래 시스템**: 모든 거래는 관리자 설정값에 따라 결정
- ✅ **무조건 성공하는 주문**: 사용자 주문은 항상 성공 처리
- ✅ **관리자 완전 제어**: 승률, 수익률, 강제 결과 등 모든 요소 제어 가능
- ✅ **실시간 UI 업데이트**: WebSocket 기반 실시간 상태 반영
- ❌ **실제 거래소 연동 없음**: 외부 거래소 API 사용하지 않음

---

## 🏛️ 시스템 아키텍처

### 📊 전체 구조도
```
┌─────────────────────────────────────────────────────────────┐
│                    QuantTrade Platform                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Next.js App Router)                             │
│  ├── 사용자 인터페이스 (React + Tailwind)                    │
│  ├── 관리자 대시보드 (실시간 제어)                           │
│  └── 인증 시스템 (JWT + 미들웨어)                           │
├─────────────────────────────────────────────────────────────┤
│  Backend API (Next.js API Routes)                          │
│  ├── 인증 API (/api/auth/*)                                │
│  ├── FlashTrade API (/api/flash-trade/*)                   │
│  ├── 관리자 API (/api/admin/*)                             │
│  └── 사용자 API (/api/user/*)                              │
├─────────────────────────────────────────────────────────────┤
│  WebSocket Server (Express.js)                             │
│  ├── 실시간 거래 상태 업데이트                               │
│  ├── 관리자 액션 브로드캐스트                               │
│  └── 가격 시뮬레이션 데이터 전송                            │
├─────────────────────────────────────────────────────────────┤
│  Database (Supabase PostgreSQL)                            │
│  ├── 사용자 정보 및 인증                                    │
│  ├── 거래 데이터 (가상)                                     │
│  ├── 관리자 설정                                           │
│  └── 잔액 및 거래 내역                                     │
└─────────────────────────────────────────────────────────────┘
```

### 🔄 데이터 흐름
```
사용자 액션 → Frontend → API Routes → Database → WebSocket → 실시간 업데이트
     ↓           ↓          ↓           ↓          ↓           ↓
  거래 요청    UI 처리    비즈니스 로직  데이터 저장  이벤트 발송  화면 갱신
```

---

## 📁 프로젝트 구조

### 🎯 디렉토리 구조
```
project-clean/
├── 📁 src/                          # 메인 소스 코드
│   ├── 📁 app/                      # Next.js App Router
│   │   ├── 📁 api/                  # API 라우트
│   │   │   ├── 📁 admin/            # 관리자 API
│   │   │   │   └── 📁 flash-trade-settings/  # FlashTrade 설정 관리
│   │   │   ├── 📁 auth/             # 인증 API
│   │   │   ├── 📁 flash-trade/      # FlashTrade API
│   │   │   │   ├── create/          # 거래 생성
│   │   │   │   ├── list/            # 거래 목록
│   │   │   │   └── auto-complete/   # 자동 완료
│   │   │   └── 📁 user/             # 사용자 API
│   │   ├── 📁 admin/                # 관리자 페이지
│   │   │   └── 📁 flash-trade-settings/  # 설정 관리 UI
│   │   ├── 📁 dashboard/            # 사용자 대시보드
│   │   ├── 📁 auth/                 # 인증 페이지
│   │   └── 📁 wallet/               # 지갑 페이지
│   ├── 📁 components/               # 재사용 컴포넌트
│   │   ├── 📁 ui/                   # shadcn/ui 컴포넌트
│   │   ├── 📁 auth/                 # 인증 컴포넌트
│   │   ├── 📁 admin/                # 관리자 컴포넌트
│   │   └── 📁 trading/              # 거래 컴포넌트
│   ├── 📁 hooks/                    # 커스텀 훅
│   ├── 📁 lib/                      # 유틸리티
│   ├── 📁 types/                    # TypeScript 타입
│   └── middleware.ts                # 인증 미들웨어
├── 📁 server/                       # WebSocket 서버
│   └── websocket-server.js          # 실시간 통신 서버
├── 📁 docs/                         # 문서 파일
└── 📁 public/                       # 정적 파일
```

---

## 🔧 기술 스택

### 🎨 Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Query + Context API
- **Form Handling**: React Hook Form + Zod

### ⚙️ Backend
- **API**: Next.js API Routes
- **WebSocket**: Express.js + Socket.io
- **Authentication**: JWT (Access + Refresh Token)
- **Validation**: Zod
- **Database ORM**: Supabase Client

### 🗄️ Database
- **Primary DB**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (JWT 기반)
- **Real-time**: Supabase Realtime (선택적 사용)

### 🚀 Deployment
- **Frontend**: Vercel
- **Database**: Supabase Cloud
- **WebSocket**: Vercel Functions (또는 별도 서버)

---

## 🔐 인증 시스템

### 🎫 JWT 토큰 구조
```typescript
// Access Token (15분)
{
  userId: string;
  email: string;
  role: 'user' | 'admin' | 'superadmin';
  exp: number;
}

// Refresh Token (7일)
{
  userId: string;
  tokenVersion: number;
  exp: number;
}
```

### 🛡️ 권한 시스템
```typescript
// 사용자 역할 정의
type UserRole = 'user' | 'admin' | 'superadmin';

// 권한 매트릭스
const permissions = {
  user: ['trade', 'wallet', 'profile'],
  admin: ['user', 'trade', 'wallet', 'profile', 'manage_settings'],
  superadmin: ['*'] // 모든 권한
};
```

### 🔒 미들웨어 보호
```typescript
// 보호된 라우트
const protectedRoutes = [
  '/dashboard/*',
  '/wallet/*',
  '/admin/*',
  '/api/flash-trade/*',
  '/api/admin/*'
];

// 관리자 전용 라우트
const adminRoutes = [
  '/admin/*',
  '/api/admin/*'
];
```

---

## ⚡ FlashTrade 가상 거래 시스템

### 🎯 핵심 개념
FlashTrade는 **완전한 가상 거래 시스템**으로, 모든 결과가 관리자 설정에 의해 결정됩니다.

### 📊 관리자 설정 구조
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

### 🔄 거래 생성 프로세스
```typescript
// 1. 사용자 거래 요청
POST /api/flash-trade/create
{
  amount: 100,
  direction: 'up',
  duration: 60,
  symbol: 'BTC/USDT'
}

// 2. 서버 처리 과정
1. 사용자 인증 확인
2. 관리자 설정 조회
3. 설정 기반 유효성 검사
4. 잔액 확인 및 차감
5. 가상 가격 시뮬레이션
6. 거래 객체 생성 (무조건 성공)

// 3. 응답
{
  success: true,
  trade: {
    id: 'trade-123',
    amount: 100,
    direction: 'up',
    entryPrice: 55000,
    potentialProfit: 85,
    expiresAt: '2024-01-01T12:01:00Z'
  }
}
```

### 🤖 자동 완료 시스템
```typescript
// 결과 결정 로직
function determineTradeResult(trade, settings) {
  // 1. 강제 결과 우선
  if (settings.forceResult) {
    return settings.forceResult;
  }
  
  // 2. 승률 기반 랜덤 결정
  const random = Math.random() * 100;
  return random < settings.winRate ? 'win' : 'lose';
}

// 수익 계산
const profit = result === 'win' 
  ? amount * (maxProfitRate / 100)
  : -amount;
```

---

## 🌐 API 설계

### 📡 API 라우트 구조
```
/api/
├── auth/
│   ├── login/           # POST - 로그인
│   ├── register/        # POST - 회원가입
│   ├── refresh/         # POST - 토큰 갱신
│   └── logout/          # POST - 로그아웃
├── admin/
│   └── flash-trade-settings/
│       ├── GET          # 설정 조회
│       ├── POST         # 설정 업데이트
│       ├── PUT          # 모든 설정 조회
│       └── DELETE       # 설정 삭제
├── flash-trade/
│   ├── create/          # POST - 거래 생성
│   ├── list/            # GET - 거래 목록
│   └── auto-complete/   # POST - 자동 완료
└── user/
    └── profile/         # GET - 사용자 정보
```

### 🔄 WebSocket 이벤트
```typescript
// 클라이언트 → 서버
{
  type: 'subscribe_trades',
  userId: 'user-123'
}

// 서버 → 클라이언트
{
  type: 'trade_update',
  data: {
    tradeId: 'trade-123',
    status: 'completed',
    result: 'win',
    profit: 85
  }
}
```

---

## 🗄️ 데이터베이스 스키마

### 👥 사용자 테이블
```sql
-- 개발 환경용 메모리 저장소 (실제로는 Supabase 테이블)
users: {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin' | 'superadmin';
  balance: number;
  isActive: boolean;
  createdAt: Date;
}
```

### ⚡ FlashTrade 테이블
```sql
-- 메모리 저장소 구조 (실제로는 PostgreSQL 테이블)
flash_trades: {
  id: string;
  userId: string;
  amount: number;
  direction: 'up' | 'down';
  duration: number;
  symbol: string;
  entryPrice: number;
  exitPrice?: number;
  status: 'active' | 'completed';
  result?: 'win' | 'lose';
  profit: number;
  createdAt: Date;
  expiresAt: Date;
  completedAt?: Date;
}
```

### ⚙️ 관리자 설정 테이블
```sql
-- 관리자 설정 구조
admin_settings: {
  id: string;
  userId?: string;  -- null이면 전체 기본 설정
  winRate: number;
  maxProfitRate: number;
  forceResult?: 'win' | 'lose';
  minAmount: number;
  maxAmount: number;
  availableDurations: number[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 🔧 개발 환경 설정

### 📦 필수 의존성
```json
{
  "dependencies": {
    "next": "14.2.29",
    "react": "^18",
    "typescript": "^5",
    "@supabase/supabase-js": "^2",
    "socket.io": "^4",
    "jsonwebtoken": "^9",
    "zod": "^3",
    "tailwindcss": "^3",
    "@radix-ui/react-*": "^1"
  }
}
```

### 🌍 환경 변수
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8082
```

### 🚀 실행 명령어
```bash
# 개발 서버 실행
npm run dev          # Next.js 서버 (포트 3000)
npm run ws:dev       # WebSocket 서버 (포트 8082)

# 빌드 및 배포
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버
```

---

## 📊 모니터링 및 로깅

### 📝 로그 구조
```typescript
// 관리자 액션 로그
console.log(`[ADMIN_ACTION] ${adminId} updated settings for ${userId}`);

// 거래 생성 로그
console.log(`✅ FlashTrade Created: ${tradeId} by ${userEmail}`);

// 자동 완료 로그
console.log(`✅ Auto-completed: ${tradeId} - ${result} - Profit: $${profit}`);
```

### 📈 성능 메트릭
- API 응답 시간
- WebSocket 연결 수
- 활성 거래 수
- 사용자 동시 접속 수

---

## 🔮 확장 계획

### 📅 Phase 2 기능
- 사용자별 개별 설정 UI
- 실시간 관리자 제어 패널
- 고급 통계 및 리포트
- 모바일 반응형 UI

### 🛡️ 보안 강화
- Rate Limiting
- CSRF 보호
- XSS 방지
- SQL Injection 방지

### 🚀 성능 최적화
- Redis 캐싱
- CDN 적용
- 이미지 최적화
- 코드 스플리팅 