# 📊 QuantTrade 플랫폼 문서

## 🎯 프로젝트 개요

**QuantTrade**는 완전한 가상 거래 시뮬레이션 플랫폼입니다. 실제 거래소 연동 없이 관리자 설정 기반의 가상 거래 환경을 제공하여 사용자에게 안전하고 통제된 거래 경험을 제공합니다.

### 🔑 핵심 특징
- ✅ **가상 거래 시스템**: 실제 거래소 연동 없이 완전한 시뮬레이션
- ✅ **관리자 완전 제어**: 승률, 수익률, 거래 결과 등 모든 요소 제어
- ✅ **무조건 성공하는 주문**: 사용자 주문은 항상 성공 처리
- ✅ **실시간 UI 업데이트**: WebSocket 기반 실시간 상태 반영
- ✅ **확장 가능한 아키텍처**: 미래 기능 추가를 고려한 설계

### 🏗️ 기술 스택
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (Access + Refresh Token)
- **Deployment**: Vercel (Frontend), Supabase (Database)
- **Real-time**: WebSocket (선택사항)

---

## 📚 문서 구조

이 문서 모음은 QuantTrade 플랫폼의 개발, 배포, 운영에 필요한 모든 정보를 포함합니다.

### 🏛️ 아키텍처 및 설계
- **[architecture.md](./architecture.md)** - 전체 시스템 아키텍처 및 기술 구조
- **[feature-spec.md](./feature-spec.md)** - 각 기능의 상세 명세서
- **[advanced-admin-control-system.md](./advanced-admin-control-system.md)** - 고급 관리자 제어 시스템 가이드

### 🚀 배포 및 설정
- **[deployment-guide.md](./deployment-guide.md)** - Vercel + 파일시스템 배포 완전 가이드
- **[env-variables.md](./env-variables.md)** - 환경 변수 설정 상세 가이드
- **[production-checklist.md](./production-checklist.md)** - 프로덕션 배포 체크리스트

### 📊 운영 및 모니터링
- **[monitoring-logging.md](./monitoring-logging.md)** - 모니터링, 로깅, 에러 추적 시스템
- **[demo-accounts.md](./demo-accounts.md)** - 테스트 계정 및 데모 가이드

### 🗺️ 개발 계획
- **[future-roadmap.md](./future-roadmap.md)** - 향후 개발 로드맵 및 우선순위

---

## 🚀 빠른 시작

### 1. 개발 환경 설정

```bash
# 저장소 클론
git clone https://github.com/your-username/quanttrade.git
cd quanttrade

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 필요한 환경 변수 설정

# 개발 서버 실행
npm run dev
```

### 2. 필수 환경 변수

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT 설정
JWT_SECRET=your_jwt_secret

# WebSocket 설정 (선택사항)
NEXT_PUBLIC_WEBSOCKET_URL=ws://localhost:8082
```

### 3. 데이터베이스 설정

Supabase 프로젝트를 생성하고 다음 테이블들을 생성하세요:

- `users` - 사용자 정보
- `flash_trades` - 거래 데이터
- `admin_settings` - 관리자 설정

자세한 설정 방법은 [deployment-guide.md](./deployment-guide.md)를 참조하세요.

---

## 🎮 주요 기능

### 🔐 인증 시스템
- JWT 기반 인증 (Access + Refresh Token)
- 역할 기반 접근 제어 (user, admin, superadmin)
- 자동 토큰 갱신
- 보안 미들웨어

### 💰 FlashTrade 가상 거래 시스템
- 관리자 설정 기반 거래 결과 결정
- 실시간 거래 생성 및 완료
- 자동 완료 시스템
- 가상 가격 시뮬레이션

### 👥 관리자 제어 시스템
- 승률 및 수익률 설정
- 강제 결과 설정 (항상 승리/패배)
- 사용자별 개별 설정
- 실시간 설정 반영

### 📊 실시간 대시보드
- 사용자 거래 현황
- 관리자 설정 인터페이스
- 실시간 통계 및 분석
- 반응형 UI

---

## 🏗️ 프로젝트 구조

```
quanttrade/
├── docs/                          # 📚 문서 모음
│   ├── README.md                  # 프로젝트 개요
│   ├── architecture.md            # 시스템 아키텍처
│   ├── feature-spec.md            # 기능 명세서
│   ├── deployment-guide.md        # 배포 가이드
│   ├── env-variables.md           # 환경 변수 가이드
│   ├── production-checklist.md    # 프로덕션 체크리스트
│   ├── monitoring-logging.md      # 모니터링 가이드
│   └── future-roadmap.md          # 개발 로드맵
├── src/
│   ├── app/                       # 🎯 Next.js App Router
│   │   ├── api/                   # API 라우트
│   │   │   ├── auth/              # 인증 API
│   │   │   ├── flash-trade/       # 거래 API
│   │   │   ├── admin/             # 관리자 API
│   │   │   └── user/              # 사용자 API
│   │   ├── admin/                 # 관리자 페이지
│   │   ├── dashboard/             # 사용자 대시보드
│   │   ├── auth/                  # 인증 페이지
│   │   └── layout.tsx             # 루트 레이아웃
│   ├── components/                # 🧩 React 컴포넌트
│   │   ├── ui/                    # 기본 UI 컴포넌트
│   │   ├── auth/                  # 인증 관련 컴포넌트
│   │   ├── trading/               # 거래 관련 컴포넌트
│   │   └── admin/                 # 관리자 컴포넌트
│   ├── lib/                       # 🔧 유틸리티 및 설정
│   │   ├── auth.ts                # 인증 로직
│   │   ├── supabase.ts            # Supabase 클라이언트
│   │   ├── utils.ts               # 공통 유틸리티
│   │   └── middleware/            # 미들웨어
│   └── types/                     # 📝 TypeScript 타입 정의
├── server/                        # 🌐 WebSocket 서버 (선택사항)
├── public/                        # 📁 정적 파일
├── .env.example                   # 환경 변수 예시
├── package.json                   # 의존성 및 스크립트
├── tailwind.config.js             # Tailwind CSS 설정
├── next.config.js                 # Next.js 설정
└── README.md                      # 프로젝트 메인 README
```

---

## 🔧 개발 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 타입 체크
npm run type-check

# 린트 검사
npm run lint

# 테스트 실행
npm run test

# API 테스트
npm run test:api
```

---

## 🎯 현재 구현 상태

### ✅ 완료된 기능

#### 🔐 인증 시스템
- [x] JWT 기반 로그인/로그아웃
- [x] 토큰 자동 갱신
- [x] 역할 기반 접근 제어
- [x] 보안 미들웨어

#### 💰 FlashTrade 시스템
- [x] 거래 생성 API
- [x] 자동 완료 시스템
- [x] 관리자 설정 기반 결과 결정
- [x] 거래 목록 및 통계

#### 👥 관리자 시스템
- [x] 설정 관리 API
- [x] 사용자별 개별 설정
- [x] 실시간 설정 반영
- [x] 관리자 대시보드 UI

#### 🎨 사용자 인터페이스
- [x] 반응형 디자인
- [x] 다크/라이트 테마
- [x] 실시간 상태 업데이트
- [x] 직관적인 거래 인터페이스

### 🔄 진행 중인 작업

- [ ] 완전한 거래 UI 모듈
- [ ] 실시간 차트 시스템
- [ ] 지갑 시스템 완성
- [ ] 모바일 최적화

### 📅 향후 계획

자세한 개발 로드맵은 [future-roadmap.md](./future-roadmap.md)를 참조하세요.

---

## 🚀 배포 가이드

### 개발 환경
1. 로컬 개발 서버 실행
2. Supabase 개발 프로젝트 연결
3. 환경 변수 설정

### 프로덕션 환경
1. Vercel 프로젝트 생성
2. Supabase 프로덕션 프로젝트 설정
3. 환경 변수 설정
4. 도메인 연결

상세한 배포 과정은 [deployment-guide.md](./deployment-guide.md)를 참조하세요.

---

## 📊 모니터링 및 운영

### 모니터링 도구
- **Vercel Analytics**: 성능 및 사용량 추적
- **Sentry**: 에러 추적 및 성능 모니터링
- **Custom Dashboard**: 실시간 시스템 상태

### 로깅 시스템
- 구조화된 JSON 로깅
- 거래별 상세 로그
- 에러 추적 및 알림

자세한 모니터링 설정은 [monitoring-logging.md](./monitoring-logging.md)를 참조하세요.

---

## 🔒 보안 고려사항

### 인증 보안
- JWT 토큰 보안 관리
- 비밀번호 해싱 (bcrypt)
- 세션 관리

### API 보안
- CORS 설정
- Rate Limiting
- 입력 데이터 검증

### 데이터 보안
- RLS (Row Level Security)
- 민감한 정보 암호화
- 환경 변수 보안

---

## 🤝 기여 가이드

### 개발 워크플로우
1. 이슈 생성 또는 기존 이슈 확인
2. 기능 브랜치 생성
3. 개발 및 테스트
4. Pull Request 생성
5. 코드 리뷰 및 머지

### 코드 스타일
- TypeScript 사용
- ESLint + Prettier 적용
- 컴포넌트 단위 개발
- 테스트 코드 작성

---

## 📞 지원 및 문의

### 기술 지원
- **이슈 트래커**: GitHub Issues
- **문서**: 이 문서 모음 참조
- **커뮤니티**: Discord/Slack 채널

### 비즈니스 문의
- **이메일**: contact@quanttrade.com
- **웹사이트**: https://quanttrade.com

---

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](../LICENSE) 파일을 참조하세요.

---

## 🙏 감사의 말

QuantTrade 플랫폼 개발에 기여해주신 모든 분들께 감사드립니다.

### 주요 기여자
- **개발팀**: 핵심 기능 개발
- **디자인팀**: UI/UX 디자인
- **QA팀**: 품질 보증 및 테스트

### 사용된 오픈소스
- Next.js, React, TypeScript
- Tailwind CSS, Radix UI
- Supabase, Vercel
- 기타 npm 패키지들

---

**QuantTrade** - 안전하고 통제된 가상 거래 경험을 제공하는 플랫폼

*마지막 업데이트: 2024년 12월* 