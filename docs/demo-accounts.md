# 데모 계정 정보

## 📋 개요

QuantTrade 플랫폼에서 테스트 및 데모용으로 사용할 수 있는 계정 정보입니다. 이 플랫폼은 **완전한 가상 시뮬레이션 기반**으로 모든 거래가 관리자 설정에 따라 제어됩니다.

## 👥 기본 데모 계정

### 1. 관리자 계정 (Admin)

```bash
이메일: admin@test.com
비밀번호: admin123
역할: admin
초기 잔액: $100,000
```

**권한:**
- ✅ 모든 사용자 관리
- ✅ 관리자 설정 제어 (승률, 수익률, 강제 결과)
- ✅ 실시간 거래 모니터링
- ✅ 관리자 대시보드 접근
- ✅ 시스템 설정 변경
- ✅ 사용자별 개별 설정 가능

**접근 가능 페이지:**
- `/admin` - 관리자 대시보드
- `/admin/settings` - 관리자 설정
- `/admin/users` - 사용자 관리
- `/admin/trades` - 거래 모니터링
- `/dashboard` - 일반 대시보드
- 모든 일반 사용자 기능

### 2. 트레이더 계정 (Trader)

```bash
이메일: trader@test.com
비밀번호: trader123
역할: trader
초기 잔액: $50,000
```

**권한:**
- ✅ 모든 거래 기능 접근
- ✅ 고급 거래 도구 사용
- ✅ 상세 분석 도구
- ✅ Quant AI 전략 사용
- ❌ 관리자 기능 접근 불가

**접근 가능 페이지:**
- `/dashboard` - 트레이더 대시보드
- `/flash-trade` - Flash Trade
- `/quick-trade` - Quick Trade
- `/quant-ai` - Quant AI 투자
- `/wallet` - 지갑 관리
- `/settings` - 개인 설정

### 3. 일반 사용자 계정 (User)

```bash
이메일: user@test.com
비밀번호: user123
역할: user
초기 잔액: $10,000
```

**권한:**
- ✅ 기본 거래 기능
- ✅ Flash Trade 사용
- ✅ 기본 지갑 기능
- ❌ 고급 거래 도구 제한
- ❌ 관리자 기능 접근 불가

**접근 가능 페이지:**
- `/dashboard` - 사용자 대시보드
- `/flash-trade` - Flash Trade
- `/wallet` - 기본 지갑 기능
- `/kyc-verification` - KYC 인증
- `/settings` - 개인 설정

## 🎛️ 관리자 설정 현황

### 전체 기본 설정

```sql
-- 모든 사용자에게 적용되는 기본값
user_id: NULL
setting_type: 'global'
win_rate: 50.00%        -- 50% 승률
max_profit_rate: 80.00% -- 최대 80% 수익률
min_profit_rate: 70.00% -- 최소 70% 수익률
force_result: NULL      -- 강제 결과 없음
```

### 특정 사용자 설정 예시

```sql
-- user@test.com 사용자에게 높은 승률 적용
user_id: 'user@test.com'
setting_type: 'user_specific'
win_rate: 80.00%        -- 80% 승률 (높음)
max_profit_rate: 90.00% -- 최대 90% 수익률
min_profit_rate: 75.00% -- 최소 75% 수익률
force_result: NULL      -- 강제 결과 없음
```

## 🧪 테스트 시나리오

### 1. 기본 로그인 테스트

```bash
# 각 계정으로 로그인 테스트
1. admin@test.com / admin123
2. trader@test.com / trader123
3. user@test.com / user123
```

### 2. Flash Trade 테스트

```typescript
// 일반 사용자로 Flash Trade 실행
{
    direction: 'up',
    amount: 100,
    duration: 60  // 1분
}

// 예상 결과: 50% 확률로 승리 (전체 기본 설정)
// user@test.com의 경우: 80% 확률로 승리 (개별 설정)
```

### 3. 관리자 제어 테스트

```typescript
// 관리자로 로그인 후 설정 변경
{
    user_id: 'trader@test.com',
    win_rate: 90.00,        // 90% 승률로 설정
    force_result: 'win'     // 항상 승리하도록 설정
}

// trader@test.com으로 거래 시 항상 승리
```

### 4. WebSocket 연결 테스트

```javascript
// 사용자 WebSocket 구독
const ws = new WebSocket('ws://localhost:8082');
ws.onopen = () => {
    ws.send(JSON.stringify({
        type: 'subscribe',
        data: { userId: 'user@test.com' }
    }));
};

// 관리자 WebSocket 구독
ws.send(JSON.stringify({
    type: 'admin_subscribe',
    data: { adminId: 'admin@test.com' }
}));
```

## 🔧 계정 생성 방법

### 새 테스트 계정 생성

```sql
-- 새 사용자 계정 생성
INSERT INTO users (email, password, first_name, last_name, role, balance) 
VALUES (
    'newuser@test.com',
    '$2b$10$hashedPasswordHere',  -- bcrypt 해시된 비밀번호
    'New',
    'User',
    'user',
    5000.00
);
```

### 비밀번호 해시 생성

```javascript
// Node.js에서 비밀번호 해시 생성
const bcrypt = require('bcryptjs');
const hashedPassword = await bcrypt.hash('password123', 10);
console.log(hashedPassword);
```

## 🎮 데모 시나리오

### 시나리오 1: 일반 사용자 체험

1. **로그인**: `user@test.com` / `user123`
2. **대시보드 확인**: 잔액 $10,000 확인
3. **Flash Trade 실행**: $100, 상승 예측, 1분
4. **결과 확인**: 80% 확률로 승리 (개별 설정)
5. **잔액 업데이트**: 승리 시 $175-180 수익

### 시나리오 2: 관리자 제어 체험

1. **관리자 로그인**: `admin@test.com` / `admin123`
2. **설정 변경**: `trader@test.com`을 항상 승리로 설정
3. **트레이더 로그인**: `trader@test.com` / `trader123`
4. **거래 실행**: 어떤 거래든 항상 승리
5. **관리자 모니터링**: 실시간 거래 결과 확인

### 시나리오 3: WebSocket 실시간 알림

1. **사용자 로그인**: 아무 계정
2. **WebSocket 연결**: 브라우저 개발자 도구에서 확인
3. **거래 실행**: Flash Trade 생성
4. **실시간 알림**: 거래 완료 시 즉시 알림 수신

## 🔐 보안 고려사항

### 프로덕션 환경에서 주의사항

```bash
# 프로덕션에서는 반드시 변경해야 할 항목들
1. 모든 기본 비밀번호 변경
2. JWT_SECRET 강력한 값으로 변경
3. 데이터베이스 비밀번호 변경
4. 관리자 계정 이메일 변경
5. 기본 잔액 설정 조정
```

### 개발 환경 전용

```bash
# 현재 계정들은 개발/테스트 전용
⚠️ 프로덕션에서 절대 사용하지 말 것
⚠️ 실제 서비스에서는 새로운 계정 생성 필요
⚠️ 기본 비밀번호는 보안상 위험
```

## 📊 계정별 기능 매트릭스

| 기능 | Admin | Trader | User |
|------|-------|--------|------|
| 로그인/로그아웃 | ✅ | ✅ | ✅ |
| 대시보드 | ✅ | ✅ | ✅ |
| Flash Trade | ✅ | ✅ | ✅ |
| Quick Trade | ✅ | ✅ | ❌ |
| Quant AI | ✅ | ✅ | ❌ |
| 지갑 관리 | ✅ | ✅ | ✅ |
| KYC 인증 | ✅ | ✅ | ✅ |
| 관리자 설정 | ✅ | ❌ | ❌ |
| 사용자 관리 | ✅ | ❌ | ❌ |
| 거래 모니터링 | ✅ | ❌ | ❌ |
| 시스템 설정 | ✅ | ❌ | ❌ |

## 🚀 빠른 테스트 가이드

### 1. 환경 설정 확인

```bash
# .env.local 파일 확인
NEXT_PUBLIC_SUPABASE_URL=https://gfzmwtvnktvvckzbybdl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
JWT_SECRET=your-super-secret-jwt-key
WEBSOCKET_PORT=8082
```

### 2. 서버 실행

```bash
# 터미널 1: Next.js 개발 서버
npm run dev

# 터미널 2: WebSocket 서버
node server/websocket.js
```

### 3. 테스트 순서

1. **http://localhost:3000** 접속
2. **관리자 로그인** → 설정 확인
3. **일반 사용자 로그인** → Flash Trade 테스트
4. **WebSocket 연결** → 실시간 알림 확인

## 🔗 관련 문서

- [현재 구현 상태 요약](./current-implementation-summary.md)
- [기능 명세서](./feature-spec.md)
- [Supabase 설정 가이드](./supabase-setup.md)
- [배포 가이드](./deployment-guide.md) 