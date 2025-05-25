# 🌍 QuantTrade 환경 변수 설정 가이드

## 📋 개요

QuantTrade 플랫폼은 다양한 환경 변수를 통해 설정을 관리합니다. 이 문서는 모든 필수 및 선택적 환경 변수에 대한 상세한 설명을 제공합니다.

### 🔑 환경 변수 분류
- **🔴 필수**: 플랫폼 동작에 반드시 필요한 변수
- **🟡 권장**: 프로덕션 환경에서 권장되는 변수
- **🟢 선택**: 추가 기능을 위한 선택적 변수

---

## 🗄️ 데이터베이스 설정 (Supabase)

### 🔴 NEXT_PUBLIC_SUPABASE_URL
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
```

**설명**: Supabase 프로젝트의 공개 URL
**획득 방법**: 
1. Supabase 대시보드 → 프로젝트 선택
2. Settings → API → Project URL 복사

**예시**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
```

### 🔴 NEXT_PUBLIC_SUPABASE_ANON_KEY
```bash
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**설명**: Supabase 익명 공개 키 (클라이언트 사이드에서 사용)
**획득 방법**:
1. Supabase 대시보드 → Settings → API
2. Project API keys → anon public 복사

**보안 주의사항**:
- 클라이언트에서 접근 가능한 공개 키
- RLS(Row Level Security) 정책으로 보호됨

### 🔴 SUPABASE_SERVICE_ROLE_KEY
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**설명**: Supabase 서비스 역할 키 (서버 사이드 전용)
**획득 방법**:
1. Supabase 대시보드 → Settings → API
2. Project API keys → service_role 복사

**⚠️ 보안 경고**:
- 절대 클라이언트에 노출하면 안됨
- 모든 데이터베이스 권한을 가짐
- 서버 사이드에서만 사용

---

## 🔐 인증 설정 (JWT)

### 🔴 JWT_SECRET
```bash
JWT_SECRET=your-super-secret-jwt-signing-key-here-make-it-long-and-random
```

**설명**: JWT 토큰 서명을 위한 비밀 키
**생성 방법**:
```bash
# Node.js로 랜덤 키 생성
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 또는 OpenSSL 사용
openssl rand -hex 64
```

**요구사항**:
- 최소 32자 이상
- 영숫자 + 특수문자 조합
- 프로덕션에서는 절대 변경하지 말 것

**예시**:
```bash
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

### 🟡 JWT_EXPIRES_IN
```bash
JWT_EXPIRES_IN=15m
```

**설명**: Access Token 만료 시간
**기본값**: 15m (15분)
**가능한 값**: 
- `15m` (15분)
- `1h` (1시간)
- `24h` (24시간)

### 🟡 JWT_REFRESH_EXPIRES_IN
```bash
JWT_REFRESH_EXPIRES_IN=7d
```

**설명**: Refresh Token 만료 시간
**기본값**: 7d (7일)
**가능한 값**:
- `7d` (7일)
- `30d` (30일)
- `90d` (90일)

---

## 🌐 WebSocket 설정

### 🟢 NEXT_PUBLIC_WEBSOCKET_URL
```bash
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8082
```

**설명**: WebSocket 서버 URL
**개발 환경**: `ws://localhost:8082`
**프로덕션 환경**: `wss://your-websocket-server.com`

**예시**:
```bash
# 개발 환경
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8082

# 프로덕션 환경 (Railway)
NEXT_PUBLIC_WEBSOCKET_URL=wss://quanttrade-websocket-production.up.railway.app

# 프로덕션 환경 (Heroku)
NEXT_PUBLIC_WEBSOCKET_URL=wss://quanttrade-websocket.herokuapp.com
```

### 🟢 WEBSOCKET_PORT
```bash
WEBSOCKET_PORT=8082
```

**설명**: WebSocket 서버 포트 (서버 사이드 전용)
**기본값**: 8082
**사용처**: `server/websocket-server.js`

---

## 🚀 애플리케이션 설정

### 🟡 NODE_ENV
```bash
NODE_ENV=production
```

**설명**: 애플리케이션 실행 환경
**가능한 값**:
- `development`: 개발 환경
- `production`: 프로덕션 환경
- `test`: 테스트 환경

### 🟡 NEXT_PUBLIC_APP_URL
```bash
NEXT_PUBLIC_APP_URL=https://quanttrade.vercel.app
```

**설명**: 애플리케이션의 공개 URL
**사용처**:
- CORS 설정
- 이메일 링크 생성
- 소셜 로그인 리다이렉트

### 🟢 NEXT_PUBLIC_APP_NAME
```bash
NEXT_PUBLIC_APP_NAME=QuantTrade
```

**설명**: 애플리케이션 이름
**기본값**: QuantTrade
**사용처**: 페이지 타이틀, 이메일 템플릿

---

## 📊 모니터링 및 분석

### 🟢 NEXT_PUBLIC_SENTRY_DSN
```bash
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

**설명**: Sentry 에러 추적 DSN
**획득 방법**:
1. Sentry 프로젝트 생성
2. Settings → Client Keys (DSN) 복사

### 🟢 NEXT_PUBLIC_GA_TRACKING_ID
```bash
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

**설명**: Google Analytics 추적 ID
**형식**: `G-XXXXXXXXXX` (GA4) 또는 `UA-XXXXXXXX-X` (Universal Analytics)

### 🟢 VERCEL_ANALYTICS_ID
```bash
VERCEL_ANALYTICS_ID=your-analytics-id
```

**설명**: Vercel Analytics ID
**자동 설정**: Vercel에서 자동으로 설정됨

---

## 🔒 보안 설정

### 🟡 CORS_ORIGIN
```bash
CORS_ORIGIN=https://quanttrade.vercel.app,https://www.quanttrade.com
```

**설명**: CORS 허용 도메인 (쉼표로 구분)
**개발 환경**: `http://localhost:3000`
**프로덕션 환경**: 실제 도메인 목록

### 🟡 RATE_LIMIT_MAX
```bash
RATE_LIMIT_MAX=100
```

**설명**: Rate Limiting 최대 요청 수
**기본값**: 100 (요청/분)
**권장값**:
- 개발: 1000
- 프로덕션: 100

### 🟡 RATE_LIMIT_WINDOW
```bash
RATE_LIMIT_WINDOW=60000
```

**설명**: Rate Limiting 시간 윈도우 (밀리초)
**기본값**: 60000 (1분)

---

## 🧪 개발 및 테스트

### 🟢 DEBUG
```bash
DEBUG=true
```

**설명**: 디버그 모드 활성화
**개발 환경**: `true`
**프로덕션 환경**: `false` 또는 설정하지 않음

### 🟢 LOG_LEVEL
```bash
LOG_LEVEL=info
```

**설명**: 로그 레벨 설정
**가능한 값**:
- `error`: 에러만
- `warn`: 경고 이상
- `info`: 정보 이상 (기본값)
- `debug`: 모든 로그

### 🟢 TEST_DATABASE_URL
```bash
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/quanttrade_test
```

**설명**: 테스트용 데이터베이스 URL
**사용처**: 자동화 테스트

---

## 📁 환경별 설정 파일

### 개발 환경 (.env.local)
```bash
# 데이터베이스
NEXT_PUBLIC_SUPABASE_URL=https://your-dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_dev_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_dev_service_key

# JWT
JWT_SECRET=your-dev-jwt-secret

# WebSocket
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8082

# 애플리케이션
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEBUG=true
LOG_LEVEL=debug

# 보안
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_MAX=1000
```

### 프로덕션 환경 (Vercel)
```bash
# 데이터베이스
NEXT_PUBLIC_SUPABASE_URL=https://your-prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_prod_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_prod_service_key

# JWT
JWT_SECRET=your-super-secure-prod-jwt-secret

# WebSocket
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket-server.com

# 애플리케이션
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://quanttrade.vercel.app

# 모니터링
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX

# 보안
CORS_ORIGIN=https://quanttrade.vercel.app,https://www.quanttrade.com
RATE_LIMIT_MAX=100
```

---

## 🔧 환경 변수 설정 방법

### 로컬 개발 환경

1. **`.env.local` 파일 생성**
   ```bash
   # 프로젝트 루트에 파일 생성
   touch .env.local
   ```

2. **환경 변수 추가**
   ```bash
   # .env.local 파일에 변수 추가
   NEXT_PUBLIC_SUPABASE_URL=your_value
   SUPABASE_SERVICE_ROLE_KEY=your_value
   JWT_SECRET=your_value
   ```

3. **Git에서 제외**
   ```bash
   # .gitignore에 추가 (이미 포함됨)
   .env.local
   .env*.local
   ```

### Vercel 배포 환경

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택

2. **환경 변수 추가**
   - Settings → Environment Variables
   - Name과 Value 입력
   - Environment 선택 (Production/Preview/Development)

3. **재배포**
   - 환경 변수 변경 후 재배포 필요
   - Deployments → Redeploy

### Railway (WebSocket 서버)

1. **Railway 대시보드 접속**
   - https://railway.app/dashboard
   - 프로젝트 선택

2. **환경 변수 설정**
   - Variables 탭
   - 변수 추가 및 저장

---

## ✅ 환경 변수 검증

### 자동 검증 스크립트
```javascript
// scripts/validate-env.js
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'JWT_SECRET'
];

function validateEnv() {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(envVar => console.error(`   - ${envVar}`));
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
}

validateEnv();
```

### 실행 방법
```bash
# 환경 변수 검증
node scripts/validate-env.js

# 또는 npm script로 추가
npm run validate:env
```

---

## 🔒 보안 모범 사례

### 1. 민감한 정보 보호
- Service Role Key는 절대 클라이언트에 노출하지 않음
- JWT Secret은 충분히 복잡하게 생성
- 프로덕션과 개발 환경의 키를 분리

### 2. 정기적인 키 로테이션
```bash
# JWT Secret 변경 시 모든 토큰 무효화됨
# 사용자 재로그인 필요

# Supabase 키 로테이션
# Supabase 대시보드에서 새 키 생성 후 교체
```

### 3. 환경별 분리
- 개발/스테이징/프로덕션 환경별로 다른 키 사용
- 테스트 환경에서는 실제 데이터 사용 금지

### 4. 접근 권한 관리
- Vercel 프로젝트 접근 권한 최소화
- Supabase 프로젝트 멤버 관리
- GitHub 저장소 접근 권한 제한

---

## 🆘 문제 해결

### 일반적인 문제들

1. **환경 변수가 undefined**
   ```bash
   # 해결 방법
   1. .env.local 파일 존재 확인
   2. 변수명 오타 확인
   3. 서버 재시작
   4. Vercel 재배포
   ```

2. **CORS 오류**
   ```bash
   # CORS_ORIGIN 확인
   CORS_ORIGIN=https://your-domain.com
   
   # 여러 도메인 허용
   CORS_ORIGIN=https://domain1.com,https://domain2.com
   ```

3. **JWT 토큰 오류**
   ```bash
   # JWT_SECRET 확인
   # 프로덕션과 개발 환경이 다른지 확인
   # 토큰 만료 시간 확인
   ```

4. **Supabase 연결 오류**
   ```bash
   # URL과 키 확인
   # 프로젝트 상태 확인 (Supabase 대시보드)
   # RLS 정책 확인
   ```

---

## 📞 추가 도움

### 공식 문서
- [Next.js 환경 변수](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel 환경 변수](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase 환경 설정](https://supabase.com/docs/guides/getting-started/local-development)

### 도구
- [환경 변수 생성기](https://generate-secret.vercel.app/)
- [JWT 디버거](https://jwt.io/)
- [환경 변수 검증 도구](https://github.com/af/envalid) 