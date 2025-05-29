# CryptoTrader Platform v2.0

## 📊 플랫폼 현황 (2024년 최신)

**전체 완성도: 85/100** 

- 🎨 **UI/UX 디자인**: 85/100 (기본 디자인 시스템 구현)
- 💻 **코드 품질**: 80/100 (TypeScript 적용, 최적화 진행 중)
- 🚀 **기능 완성도**: 85/100 (주요 기능 구현 완료)
- 🏗️ **배포 준비도**: 80/100 (개발 환경 구성 완료)

## 🎯 프로젝트 소개

CryptoTrader는 **암호화폐 거래 플랫폼**으로, Flash Trade 시스템을 통해 단기 거래 경험을 제공합니다.

### ✨ 주요 특징

- **⚡ Flash Trade 시스템**: 30초, 1분, 2분, 5분 단기 거래
- **🌍 다국어 지원**: 10개 언어 지원
- **🎨 현대적인 디자인**: 다크 테마 기반 UI
- **📱 반응형 디자인**: 모바일 및 데스크탑 지원
- **🛡️ 보안 시스템**: JWT 기반 인증

## 🚀 빠른 시작

### 환경 요구사항
- Node.js 18+ 
- npm 또는 yarn
- PostgreSQL (선택사항, 개발시 Supabase 사용)

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/your-username/cryptotrader.git
cd cryptotrader

# 의존성 설치
npm install

# 환경변수 설정
cp env.example .env.local
# .env.local 파일을 편집하여 필요한 값들을 설정

# 개발 서버 시작
npm run dev

# 또는 프로덕션 빌드
npm run build
npm start
```

서버가 시작되면 [http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 🏗️ 기술 스택

### Frontend
- **Next.js 14** - App Router, Server Components
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 스타일링
- **React Query** - 서버 상태 관리
- **Framer Motion** - 애니메이션
- **react-i18next** - 국제화

### Backend
- **Next.js API Routes** - 서버리스 API
- **Drizzle ORM** - 데이터베이스 관리
- **Supabase** - 데이터베이스 및 인증
- **WebSocket** - 실시간 통신
- **JWT** - 인증 시스템

### DevOps & Tools
- **Docker** - 컨테이너화
- **Vercel** - 배포 플랫폼 (계획)
- **GitHub Actions** - CI/CD (계획)
- **Playwright** - E2E 테스트
- **Jest** - 유닛 테스트

## 📁 프로젝트 구조

```
cryptotrader/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx       # 루트 레이아웃
│   │   ├── page.tsx         # 홈페이지
│   │   └── api/             # API 라우트
│   ├── components/          # 재사용 가능한 컴포넌트
│   ├── lib/                 # 유틸리티 및 설정
│   ├── styles/              # 스타일 파일
│   └── types/               # TypeScript 타입 정의
├── docs/                    # 프로젝트 문서
├── tests/                   # 테스트 파일
├── public/                  # 정적 파일
└── server/                  # 백엔드 서버
```

## ⚡ Flash Trade 시스템

### 주요 기능
- **거래 기간**: 30초, 60초, 120초, 300초
- **거래 방향**: UP/DOWN 선택
- **거래 금액**: 최소 10 ~ 최대 1,000 USDT
- **즉시 결과**: 거래 종료 시 즉시 결과 확인

### 거래 프로세스
1. 거래 금액 설정
2. 방향(UP/DOWN) 선택  
3. 거래 기간 선택
4. 거래 시작 및 결과 대기
5. 수익/손실 계산 및 잔액 반영

## 🌍 다국어 지원

지원 언어:
- 🇰🇷 **한국어** (ko)
- 🇺🇸 **영어** (en)  
- 🇨🇳 **중국어 간체** (zh-CN)
- 🇹🇼 **중국어 번체** (zh-TW)
- 🇯🇵 **일본어** (ja)
- 🇫🇷 **프랑스어** (fr)
- 🇩🇪 **독일어** (de)
- 🇪🇸 **스페인어** (es)
- 🇮🇹 **이탈리아어** (it)
- 🇷🇺 **러시아어** (ru)

## 🔒 보안 기능

- **JWT 기반 인증**: 안전한 토큰 기반 인증
- **Rate Limiting**: API 요청 제한
- **CORS 보안**: 교차 출처 요청 보호
- **암호화**: 비밀번호 해싱

## 🧪 테스트

```bash
# 유닛 테스트
npm run test

# E2E 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:coverage

# 린팅
npm run lint

# 타입 체크
npm run type-check
```

## 📈 배포

### Docker
```bash
# 이미지 빌드
docker build -t cryptotrader .

# 컨테이너 실행
docker run -p 3000:3000 cryptotrader
```

### 환경변수 설정
배포 전 다음 환경변수들을 설정해야 합니다:

```bash
NEXT_PUBLIC_APP_URL=https://your-domain.com
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-secret-key
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원

- 📧 **이메일**: support@cryptotrader.com
- 📚 **문서**: [docs/](./docs/) 폴더 참조

---

**CryptoTrader** - 암호화폐 거래 플랫폼 🚀 