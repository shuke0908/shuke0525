# 🔑 환경변수 완전 가이드

Vercel 배포에 필요한 모든 환경변수들과 설정 방법을 자세히 설명합니다.

## 📋 환경변수 목록

### 🚨 필수 환경변수 (반드시 설정)

#### 1. Supabase 데이터베이스 연결
```bash
NEXT_PUBLIC_SUPABASE_URL=https://gfzmwtvnktvvckzbybdl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**어디서 찾나요?**
1. [Supabase 대시보드](https://app.supabase.com) 로그인
2. 프로젝트 선택
3. 좌측 메뉴 "Settings" → "API" 클릭
4. **Project URL** = `NEXT_PUBLIC_SUPABASE_URL`
5. **anon public** = `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. **service_role secret** = `SUPABASE_SERVICE_ROLE_KEY`

**주의사항:**
- `service_role` 키는 절대 클라이언트에 노출되면 안됩니다
- `anon` 키는 공개되어도 괜찮습니다 (RLS 정책으로 보호됨)

#### 2. 애플리케이션 URL 설정
```bash
NEXT_PUBLIC_APP_URL=https://your-app-name.vercel.app
NEXT_PUBLIC_API_URL=https://your-app-name.vercel.app/api
CORS_ORIGIN=https://your-app-name.vercel.app
```

**설정 방법:**
1. 처음 배포 시에는 임시로 설정:
   ```bash
   NEXT_PUBLIC_APP_URL=https://temporary-url.vercel.app
   ```
2. 배포 완료 후 실제 URL로 업데이트:
   ```bash
   NEXT_PUBLIC_APP_URL=https://my-crypto-app-abc123.vercel.app
   ```

#### 3. 보안 키 (JWT, 세션)
```bash
JWT_SECRET=abcd1234567890abcd1234567890abcd1234567890abcd1234567890abcd1234
SESSION_SECRET=xyz9876543210xyz9876543210xyz9876543210xyz9876543210xyz98765432
NEXTAUTH_SECRET=def5555666677778888def5555666677778888def5555666677778888def55556
```

**생성 방법:**
```bash
# 방법 1: Node.js 사용
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 방법 2: 온라인 생성기
# https://generate-secret.vercel.app/ 접속하여 생성

# 방법 3: OpenSSL 사용
openssl rand -hex 32
```

**중요사항:**
- 각각 다른 키를 사용해야 합니다
- 최소 32자 이상의 랜덤 문자열
- 한번 설정한 후에는 변경하면 안됩니다 (기존 세션 무효화됨)

### ⚙️ 선택적 환경변수

#### 4. 구글 서비스 (OAuth, Analytics)
```bash
# OAuth 로그인용
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ABCDEF-1234567890-xyz

# 구글 애널리틱스
NEXT_PUBLIC_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# 검색 엔진 검증
NEXT_PUBLIC_GOOGLE_VERIFICATION=abcd1234efgh5678
```

**설정 방법:**
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. "APIs & Services" → "Credentials" 이동
4. "Create Credentials" → "OAuth 2.0 Client IDs" 선택
5. Application type: "Web application"
6. Authorized redirect URIs에 추가:
   ```
   https://your-app-name.vercel.app/api/auth/callback/google
   ```

#### 5. 이메일 서비스 (SMTP)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

**Gmail 앱 비밀번호 생성:**
1. Google 계정 설정으로 이동
2. "보안" → "2단계 인증" 활성화
3. "앱 비밀번호" 생성
4. 생성된 16자리 비밀번호를 `SMTP_PASS`에 설정

#### 6. 결제 서비스 (Stripe)
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 7. 분석 및 모니터링
```bash
# Sentry 에러 트래킹
SENTRY_DSN=https://abcd1234@o123456.ingest.sentry.io/123456

# Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id
```

#### 8. 검색 엔진 검증
```bash
NEXT_PUBLIC_GOOGLE_VERIFICATION=abc123def456
NEXT_PUBLIC_NAVER_VERIFICATION=naver123456
NEXT_PUBLIC_YANDEX_VERIFICATION=yandex789012
```

### 🌍 환경별 설정

#### 개발 환경 (.env.local)
```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

#### 프로덕션 환경 (Vercel)
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_API_URL=https://your-app.vercel.app/api
```

## 🔧 Vercel에서 환경변수 설정하기

### 방법 1: 웹 대시보드 사용

1. **Vercel 대시보드 접속**
   - [vercel.com](https://vercel.com) 로그인
   - 프로젝트 선택

2. **Settings 탭 이동**
   - "Settings" 클릭
   - "Environment Variables" 선택

3. **환경변수 추가**
   ```
   Name: NEXT_PUBLIC_SUPABASE_URL
   Value: https://your-project-id.supabase.co
   Environment: Production, Preview, Development (모두 선택)
   ```

4. **"Add" 버튼 클릭**

5. **모든 변수 반복**

### 방법 2: Vercel CLI 사용

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 환경변수 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# 값 입력: https://your-project-id.supabase.co

vercel env add JWT_SECRET production
# 값 입력: your-generated-jwt-secret
```

### 방법 3: .env 파일 import

```bash
# .env 파일이 있는 경우
vercel env pull .env.local
vercel env push .env.local
```

## 🔍 환경변수 확인 및 검증

### 1. Vercel 대시보드에서 확인
- Settings → Environment Variables
- 모든 필수 변수가 설정되어 있는지 확인
- 값이 올바른지 확인 (앞 몇 글자만 보임)

### 2. 런타임에서 확인
```javascript
// 브라우저 콘솔에서 확인 (public 변수만)
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL);

// 서버에서 확인 (모든 변수)
console.log(process.env.JWT_SECRET);
```

### 3. API 엔드포인트로 확인
```javascript
// pages/api/env-check.js
export default function handler(req, res) {
  res.json({
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    jwtSecret: !!process.env.JWT_SECRET,
    // 실제 값은 노출하지 않고 존재 여부만 확인
  });
}
```

## 🚨 보안 주의사항

### ✅ 안전한 환경변수
- `NEXT_PUBLIC_*` - 클라이언트에 노출되어도 안전
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

### ⚠️ 위험한 환경변수 (절대 노출 금지)
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `SESSION_SECRET`
- `STRIPE_SECRET_KEY`
- `DATABASE_URL`

### 보안 체크리스트
- [ ] `NEXT_PUBLIC_`이 붙지 않은 민감한 정보는 서버에서만 사용
- [ ] GitHub에 `.env` 파일 커밋하지 않기 (`.gitignore`에 추가)
- [ ] 주기적으로 보안 키 회전 (JWT, 세션 키)
- [ ] Supabase RLS 정책 설정
- [ ] API 엔드포인트에 적절한 인증 구현

## 🛠️ 문제 해결

### 문제 1: 환경변수가 undefined
**증상:**
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL); // undefined
```

**해결방법:**
1. 변수명 오타 확인
2. Vercel에서 재배포 실행
3. 브라우저 캐시 삭제
4. `NEXT_PUBLIC_` 접두사 확인

### 문제 2: 서버 환경변수 접근 불가
**증상:**
```javascript
// 클라이언트에서 접근 불가
console.log(process.env.JWT_SECRET); // undefined
```

**해결방법:**
- 서버 전용 변수는 API 라우트에서만 사용
- `NEXT_PUBLIC_` 접두사 필요한 경우 추가

### 문제 3: Vercel 배포 후 환경변수 미적용
**해결방법:**
1. 환경변수 설정 후 **반드시 재배포**
2. Vercel 대시보드에서 "Redeploy" 클릭
3. 또는 GitHub에 새 커밋 푸시

## 📋 환경변수 체크리스트

### 필수 설정 (배포 전)
- [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase 프로젝트 URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon 키
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role 키
- [ ] `JWT_SECRET` - JWT 암호화 키 (32자 이상)
- [ ] `SESSION_SECRET` - 세션 암호화 키 (32자 이상)
- [ ] `NEXTAUTH_SECRET` - NextAuth 암호화 키 (32자 이상)
- [ ] `NODE_ENV=production` - 프로덕션 환경 설정

### 배포 후 업데이트
- [ ] `NEXT_PUBLIC_APP_URL` - 실제 배포 URL로 변경
- [ ] `NEXT_PUBLIC_API_URL` - 실제 API URL로 변경
- [ ] `CORS_ORIGIN` - 실제 도메인으로 변경

### 선택적 설정
- [ ] Google OAuth 키들
- [ ] SMTP 이메일 설정
- [ ] 결제 서비스 키들
- [ ] 분석 서비스 키들

---

**이 가이드를 따라하면 환경변수 설정이 완벽하게 완료됩니다! 🎉** 