# 🚀 QuantTrade 배포 가이드

## 📋 배포 개요

QuantTrade 플랫폼은 **Vercel (Frontend)** + **Supabase (Database & Auth)** 조합으로 배포됩니다.

### 🏗️ 배포 아키텍처
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Vercel      │    │    Supabase     │    │   WebSocket     │
│   (Frontend)    │◄──►│   (Database)    │    │    Server       │
│   Next.js App   │    │   PostgreSQL    │    │  (Optional)     │
│   API Routes    │    │   Auth System   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🎯 배포 목표
- ✅ 완전한 가상 거래 시스템 배포
- ✅ 관리자 설정 기반 거래 제어
- ✅ 실시간 WebSocket 통신
- ✅ 안전한 인증 시스템
- ✅ 확장 가능한 아키텍처

---

## 📋 사전 준비사항

### 🔧 필수 도구
- Node.js 18+ 설치
- Git 설치
- Vercel CLI 설치
- Supabase CLI 설치 (선택사항)

### 📦 계정 준비
- [Vercel 계정](https://vercel.com) 생성
- [Supabase 계정](https://supabase.com) 생성
- GitHub 계정 (코드 저장소용)

### 🌍 환경 변수 준비
```bash
# 필수 환경 변수 목록
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
NEXT_PUBLIC_WEBSOCKET_URL=
```

---

## 🗄️ 1단계: Supabase 데이터베이스 설정

### 1.1 Supabase 프로젝트 생성

1. **Supabase 대시보드 접속**
   - https://app.supabase.com 방문
   - "New Project" 클릭

2. **프로젝트 설정**
   ```
   Project Name: quanttrade-production
   Database Password: [강력한 비밀번호 생성]
   Region: Northeast Asia (Seoul) - 한국 사용자용
   ```

3. **프로젝트 생성 대기**
   - 약 2-3분 소요
   - 데이터베이스 초기화 완료까지 대기

### 1.2 데이터베이스 스키마 생성

1. **SQL Editor 접속**
   - Supabase 대시보드 → SQL Editor

2. **사용자 테이블 생성**
   ```sql
   -- 사용자 테이블
   CREATE TABLE users (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email VARCHAR(255) UNIQUE NOT NULL,
     username VARCHAR(100) NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'superadmin')),
     balance DECIMAL(15,2) DEFAULT 0.00,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- 사용자 테이블 인덱스
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_users_role ON users(role);
   ```

3. **FlashTrade 테이블 생성**
   ```sql
   -- FlashTrade 거래 테이블
   CREATE TABLE flash_trades (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     amount DECIMAL(15,2) NOT NULL,
     direction VARCHAR(10) NOT NULL CHECK (direction IN ('up', 'down')),
     duration INTEGER NOT NULL,
     symbol VARCHAR(20) DEFAULT 'BTC/USDT',
     entry_price DECIMAL(15,2) NOT NULL,
     exit_price DECIMAL(15,2),
     status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
     result VARCHAR(10) CHECK (result IN ('win', 'lose')),
     profit DECIMAL(15,2) DEFAULT 0.00,
     potential_profit DECIMAL(15,2) NOT NULL,
     return_rate DECIMAL(5,2) NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
     completed_at TIMESTAMP WITH TIME ZONE
   );

   -- FlashTrade 테이블 인덱스
   CREATE INDEX idx_flash_trades_user_id ON flash_trades(user_id);
   CREATE INDEX idx_flash_trades_status ON flash_trades(status);
   CREATE INDEX idx_flash_trades_expires_at ON flash_trades(expires_at);
   ```

4. **관리자 설정 테이블 생성**
   ```sql
   -- 관리자 설정 테이블
   CREATE TABLE admin_settings (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     win_rate INTEGER NOT NULL CHECK (win_rate >= 0 AND win_rate <= 100),
     max_profit_rate INTEGER NOT NULL CHECK (max_profit_rate >= 10 AND max_profit_rate <= 200),
     force_result VARCHAR(10) CHECK (force_result IN ('win', 'lose')),
     min_amount DECIMAL(15,2) NOT NULL,
     max_amount DECIMAL(15,2) NOT NULL,
     available_durations INTEGER[] NOT NULL,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- 관리자 설정 인덱스
   CREATE INDEX idx_admin_settings_user_id ON admin_settings(user_id);
   CREATE UNIQUE INDEX idx_admin_settings_global ON admin_settings(id) WHERE user_id IS NULL;
   ```

### 1.3 기본 데이터 삽입

1. **관리자 계정 생성**
   ```sql
   -- 관리자 계정 (비밀번호: password123)
   INSERT INTO users (email, username, password_hash, role, balance) VALUES
   ('admin@quanttrade.com', 'admin', '$2b$10$hash_here', 'superadmin', 10000.00),
   ('user@quanttrade.com', 'user', '$2b$10$hash_here', 'user', 1000.00),
   ('trader@quanttrade.com', 'trader', '$2b$10$hash_here', 'admin', 5000.00);
   ```

2. **기본 관리자 설정**
   ```sql
   -- 전체 기본 설정
   INSERT INTO admin_settings (
     user_id, win_rate, max_profit_rate, min_amount, max_amount, 
     available_durations, is_active
   ) VALUES (
     NULL, 45, 85, 10.00, 10000.00, 
     ARRAY[30, 60, 120, 300], true
   );
   ```

### 1.4 RLS (Row Level Security) 설정

1. **RLS 활성화**
   ```sql
   -- 모든 테이블에 RLS 활성화
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE flash_trades ENABLE ROW LEVEL SECURITY;
   ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
   ```

2. **정책 생성**
   ```sql
   -- 사용자는 자신의 데이터만 조회 가능
   CREATE POLICY "Users can view own data" ON users
     FOR SELECT USING (auth.uid() = id);

   -- 사용자는 자신의 거래만 조회 가능
   CREATE POLICY "Users can view own trades" ON flash_trades
     FOR SELECT USING (auth.uid() = user_id);

   -- 관리자는 모든 데이터 접근 가능
   CREATE POLICY "Admins can access all data" ON users
     FOR ALL USING (
       EXISTS (
         SELECT 1 FROM users 
         WHERE id = auth.uid() 
         AND role IN ('admin', 'superadmin')
       )
     );
   ```

### 1.5 API 키 확인

1. **프로젝트 설정 → API**
   - Project URL 복사
   - anon public key 복사
   - service_role key 복사 (보안 주의)

---

## 🚀 2단계: Vercel 배포 설정

### 2.1 GitHub 저장소 준비

1. **코드 저장소 생성**
   ```bash
   # 로컬 프로젝트를 GitHub에 푸시
   git init
   git add .
   git commit -m "Initial commit: QuantTrade platform"
   git branch -M main
   git remote add origin https://github.com/username/quanttrade.git
   git push -u origin main
   ```

### 2.2 Vercel 프로젝트 생성

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - "New Project" 클릭

2. **GitHub 저장소 연결**
   - GitHub 계정 연결
   - quanttrade 저장소 선택
   - "Import" 클릭

3. **프로젝트 설정**
   ```
   Project Name: quanttrade-production
   Framework Preset: Next.js
   Root Directory: ./
   Build Command: npm run build
   Output Directory: .next
   Install Command: npm install
   ```

### 2.3 환경 변수 설정

1. **Vercel 환경 변수 추가**
   - Project Settings → Environment Variables

   ```bash
   # Supabase 설정
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

   # JWT 설정
   JWT_SECRET=your_super_secret_jwt_key_here

   # WebSocket 설정 (선택사항)
   NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket-server.com

   # 환경 설정
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

2. **환경별 변수 설정**
   - Production: 프로덕션 환경용
   - Preview: 스테이징 환경용
   - Development: 개발 환경용

### 2.4 빌드 설정 최적화

1. **next.config.js 수정**
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     experimental: {
       turbo: true,
     },
     images: {
       domains: ['your-domain.com'],
     },
     env: {
       CUSTOM_KEY: process.env.CUSTOM_KEY,
     },
     // Vercel 최적화
     poweredByHeader: false,
     compress: true,
     // 정적 파일 최적화
     assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
   };

   module.exports = nextConfig;
   ```

2. **vercel.json 설정**
   ```json
   {
     "framework": "nextjs",
     "buildCommand": "npm run build",
     "devCommand": "npm run dev",
     "installCommand": "npm install",
     "functions": {
       "src/app/api/**/*.ts": {
         "maxDuration": 30
       }
     },
     "headers": [
       {
         "source": "/api/(.*)",
         "headers": [
           {
             "key": "Access-Control-Allow-Origin",
             "value": "*"
           },
           {
             "key": "Access-Control-Allow-Methods",
             "value": "GET, POST, PUT, DELETE, OPTIONS"
           },
           {
             "key": "Access-Control-Allow-Headers",
             "value": "Content-Type, Authorization"
           }
         ]
       }
     ]
   }
   ```

---

## 🌐 3단계: WebSocket 서버 배포 (선택사항)

### 3.1 Railway 배포 (추천)

1. **Railway 계정 생성**
   - https://railway.app 방문
   - GitHub 계정으로 로그인

2. **새 프로젝트 생성**
   - "New Project" → "Deploy from GitHub repo"
   - WebSocket 서버 저장소 선택

3. **환경 변수 설정**
   ```bash
   PORT=8080
   NODE_ENV=production
   CORS_ORIGIN=https://your-app.vercel.app
   ```

4. **서버 코드 수정**
   ```javascript
   // server/websocket-server.js
   const PORT = process.env.PORT || 8080;
   const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

   const io = socketIo(server, {
     cors: {
       origin: CORS_ORIGIN,
       methods: ["GET", "POST"]
     }
   });

   server.listen(PORT, () => {
     console.log(`WebSocket server running on port ${PORT}`);
   });
   ```

### 3.2 Vercel Functions 대안

1. **WebSocket API 라우트 생성**
   ```typescript
   // src/app/api/websocket/route.ts
   import { NextRequest } from 'next/server';

   export async function GET(request: NextRequest) {
     // WebSocket 연결 처리
     // Vercel Functions는 WebSocket을 직접 지원하지 않으므로
     // Server-Sent Events (SSE) 또는 폴링 방식 사용
   }
   ```

---

## 🔧 4단계: 배포 후 설정

### 4.1 도메인 설정

1. **커스텀 도메인 추가**
   - Vercel Project Settings → Domains
   - 도메인 추가 및 DNS 설정

2. **SSL 인증서**
   - Vercel에서 자동으로 Let's Encrypt 인증서 발급
   - HTTPS 강제 리다이렉트 활성화

### 4.2 성능 최적화

1. **Vercel Analytics 활성화**
   ```bash
   npm install @vercel/analytics
   ```

   ```typescript
   // src/app/layout.tsx
   import { Analytics } from '@vercel/analytics/react';

   export default function RootLayout({
     children,
   }: {
     children: React.ReactNode;
   }) {
     return (
       <html lang="ko">
         <body>
           {children}
           <Analytics />
         </body>
       </html>
     );
   }
   ```

2. **이미지 최적화**
   ```typescript
   // next.config.js
   module.exports = {
     images: {
       domains: ['your-cdn.com'],
       formats: ['image/webp', 'image/avif'],
     },
   };
   ```

### 4.3 모니터링 설정

1. **Vercel 모니터링**
   - Functions 실행 시간 모니터링
   - 에러 로그 확인
   - 성능 메트릭 추적

2. **Supabase 모니터링**
   - 데이터베이스 성능 모니터링
   - API 사용량 추적
   - 에러 로그 확인

---

## 🧪 5단계: 배포 테스트

### 5.1 기능 테스트

1. **인증 시스템 테스트**
   ```bash
   # 프로덕션 환경에서 로그인 테스트
   curl -X POST https://your-app.vercel.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@quanttrade.com","password":"password123"}'
   ```

2. **FlashTrade 시스템 테스트**
   ```bash
   # 관리자 설정 조회
   curl https://your-app.vercel.app/api/admin/flash-trade-settings \
     -H "Authorization: Bearer your_token"

   # 거래 생성 테스트
   curl -X POST https://your-app.vercel.app/api/flash-trade/create \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer your_token" \
     -d '{"amount":100,"direction":"up","duration":60}'
   ```

### 5.2 성능 테스트

1. **로드 테스트**
   ```bash
   # Apache Bench를 사용한 부하 테스트
   ab -n 1000 -c 10 https://your-app.vercel.app/

   # 또는 Artillery 사용
   npm install -g artillery
   artillery quick --count 10 --num 100 https://your-app.vercel.app/
   ```

2. **API 응답 시간 테스트**
   ```bash
   # API 응답 시간 측정
   curl -w "@curl-format.txt" -o /dev/null -s https://your-app.vercel.app/api/user/profile
   ```

---

## 🔒 6단계: 보안 설정

### 6.1 환경 변수 보안

1. **민감한 정보 보호**
   - Service Role Key는 서버 사이드에서만 사용
   - JWT Secret은 충분히 복잡하게 생성
   - 정기적인 키 로테이션

2. **CORS 설정**
   ```typescript
   // src/middleware.ts
   export function middleware(request: NextRequest) {
     const response = NextResponse.next();
     
     // CORS 헤더 설정
     response.headers.set('Access-Control-Allow-Origin', 'https://your-domain.com');
     response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
     response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
     
     return response;
   }
   ```

### 6.2 Rate Limiting

1. **Vercel Edge Config 사용**
   ```typescript
   // src/app/api/auth/login/route.ts
   import { ratelimit } from '@/lib/ratelimit';

   export async function POST(request: NextRequest) {
     const ip = request.ip ?? '127.0.0.1';
     const { success } = await ratelimit.limit(ip);

     if (!success) {
       return NextResponse.json(
         { error: 'Too many requests' },
         { status: 429 }
       );
     }

     // 로그인 로직...
   }
   ```

---

## 📊 7단계: 모니터링 및 로깅

### 7.1 에러 추적

1. **Sentry 설정**
   ```bash
   npm install @sentry/nextjs
   ```

   ```javascript
   // sentry.client.config.js
   import * as Sentry from '@sentry/nextjs';

   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     environment: process.env.NODE_ENV,
   });
   ```

### 7.2 로그 관리

1. **구조화된 로깅**
   ```typescript
   // src/lib/logger.ts
   export const logger = {
     info: (message: string, meta?: any) => {
       console.log(JSON.stringify({
         level: 'info',
         message,
         timestamp: new Date().toISOString(),
         ...meta
       }));
     },
     error: (message: string, error?: Error, meta?: any) => {
       console.error(JSON.stringify({
         level: 'error',
         message,
         error: error?.message,
         stack: error?.stack,
         timestamp: new Date().toISOString(),
         ...meta
       }));
     }
   };
   ```

---

## 🔄 8단계: CI/CD 파이프라인

### 8.1 GitHub Actions 설정

1. **자동 배포 워크플로우**
   ```yaml
   # .github/workflows/deploy.yml
   name: Deploy to Vercel

   on:
     push:
       branches: [main]
     pull_request:
       branches: [main]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         
         - name: Setup Node.js
           uses: actions/setup-node@v3
           with:
             node-version: '18'
             cache: 'npm'
             
         - name: Install dependencies
           run: npm ci
           
         - name: Run tests
           run: npm test
           
         - name: Build project
           run: npm run build
           
         - name: Deploy to Vercel
           uses: amondnet/vercel-action@v25
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.ORG_ID }}
             vercel-project-id: ${{ secrets.PROJECT_ID }}
   ```

### 8.2 자동 테스트

1. **테스트 스크립트 실행**
   ```json
   {
     "scripts": {
       "test": "jest",
       "test:e2e": "playwright test",
       "test:api": "node test-flash-trade-system.js"
     }
   }
   ```

---

## 📋 배포 체크리스트

### ✅ 배포 전 확인사항

- [ ] 모든 환경 변수 설정 완료
- [ ] 데이터베이스 스키마 생성 완료
- [ ] 기본 데이터 삽입 완료
- [ ] 테스트 계정 생성 완료
- [ ] CORS 설정 확인
- [ ] SSL 인증서 설정 확인
- [ ] 도메인 연결 확인

### ✅ 배포 후 확인사항

- [ ] 로그인/로그아웃 기능 테스트
- [ ] 관리자 설정 페이지 접근 테스트
- [ ] FlashTrade 생성/완료 테스트
- [ ] API 응답 시간 확인
- [ ] 에러 로그 모니터링 설정
- [ ] 성능 메트릭 확인
- [ ] 보안 설정 검증

---

## 🆘 문제 해결

### 일반적인 문제들

1. **환경 변수 오류**
   ```bash
   # Vercel에서 환경 변수 확인
   vercel env ls

   # 로컬에서 환경 변수 테스트
   vercel dev
   ```

2. **데이터베이스 연결 오류**
   ```sql
   -- Supabase에서 연결 테스트
   SELECT NOW();
   ```

3. **빌드 오류**
   ```bash
   # 로컬에서 빌드 테스트
   npm run build

   # 의존성 문제 해결
   npm ci
   ```

4. **CORS 오류**
   ```typescript
   // API 라우트에 CORS 헤더 추가
   export async function OPTIONS() {
     return new NextResponse(null, {
       status: 200,
       headers: {
         'Access-Control-Allow-Origin': '*',
         'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
         'Access-Control-Allow-Headers': 'Content-Type, Authorization',
       },
     });
   }
   ```

---

## 📞 지원 및 문의

### 공식 문서
- [Vercel 문서](https://vercel.com/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Next.js 문서](https://nextjs.org/docs)

### 커뮤니티
- [Vercel Discord](https://discord.gg/vercel)
- [Supabase Discord](https://discord.supabase.com)
- [Next.js GitHub](https://github.com/vercel/next.js)

배포 과정에서 문제가 발생하면 위 리소스를 참고하거나 각 플랫폼의 지원팀에 문의하세요. 