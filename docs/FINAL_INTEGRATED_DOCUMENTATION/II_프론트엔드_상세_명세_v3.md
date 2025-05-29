# II. 프론트엔드 상세 명세 (최종 통합 버전)

**최종 업데이트**: 2024년 12월 27일  
**기반**: 실제 코드베이스 완전 분석

---

## 🏗️ 아키텍처 개요

### Next.js 14 App Router 구조
```
src/app/
├── layout.tsx           # 루트 레이아웃
├── page.tsx            # 홈페이지 (16KB)
├── globals.css         # 글로벌 스타일 (14KB)
├── dashboard/          # 사용자 대시보드
├── admin/              # 관리자 페이지
├── auth/               # 인증 페이지
└── api/                # API 엔드포인트 (20개)
```

### 핵심 기술 스택 (검증된 버전)
- **Next.js**: 14.2.29 (App Router)
- **React**: 18.2.0 + TypeScript 5.8.3
- **UI**: Radix UI + Tailwind CSS 3.4.1
- **상태관리**: Context API + React Query 5.77.2
- **국제화**: react-i18next 15.5.2
- **애니메이션**: Framer Motion 11.18.2

---

## 🎨 UI 컴포넌트 시스템

### 디자인 토큰 (실제 CSS 변수)
```css
:root {
  --primary-blue: #3B82F6;
  --background-primary: #0A0A0B;
  --background-secondary: #1A1A1C;
  --success-green: #16A34A;
  --danger-red: #EF4444;
}
```

### 주요 컴포넌트 (src/components/ui/)
1. **Button**: 6가지 변형 (Primary, Success, Danger, Outline, Ghost, Link)
2. **Card**: 글래스모피즘 효과
3. **Input**: 검증 통합
4. **Modal**: Dialog + Alert Dialog
5. **Toast**: 4가지 타입 알림

---

## 📱 페이지별 기능 명세

### 1. 홈페이지 (/)
- **파일**: `src/app/page.tsx` (16KB, 363줄)
- **기능**: 랜딩 페이지, 다국어 지원
- **특징**: 반응형, SEO 최적화

### 2. 인증 페이지
- **로그인**: `/auth/login`
- **회원가입**: `/auth/register`
- **기능**: JWT 인증, 폼 검증

### 3. 대시보드 (/dashboard)
#### 메인 대시보드
- 잔액 표시, 거래 현황
- 실시간 데이터 업데이트

#### Flash Trade (/dashboard/flash-trade)
- 거래 시간: 30초, 60초, 120초, 300초
- UP/DOWN 선택
- 실시간 차트 (TradingView)

#### 지갑 (/dashboard/wallet)
- 입출금 관리
- 거래 내역
- KYC 문서 업로드

### 4. 관리자 페이지 (/admin)
- 사용자 관리
- 거래 설정 제어
- 시스템 모니터링

---

## 🌍 국제화 시스템

### 지원 언어 (10개)
```javascript
const languages = {
  ko: '한국어',
  en: 'English',
  'zh-CN': '中文(简体)',
  'zh-TW': '中文(繁體)',
  ja: '日本語',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  it: 'Italiano',
  ru: 'Русский'
};
```

### 번역 키 구조
- **common**: 공통 UI 요소
- **trading**: 거래 관련 용어
- **auth**: 인증 관련
- **admin**: 관리자 전용
- **landing**: 랜딩 페이지

---

## 📊 상태 관리

### Context API 구조
```typescript
interface AppContextType {
  user: User | null;
  balance: number;
  activeTrades: Trade[];
  isLoading: boolean;
}
```

### React Query 사용
- API 데이터 캐싱
- 자동 재검증
- 낙관적 업데이트

---

## 🔧 개발 환경

### 필수 환경변수
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
JWT_SECRET=your_secret
```

### 빌드 명령어
```bash
npm run dev           # 개발 서버
npm run build         # 프로덕션 빌드
npm run lint          # 코드 검사
npm run type-check    # 타입 검사
```

---

## ✅ 구현 완료 상태

### 100% 완료
- [x] 모든 페이지 구현
- [x] 반응형 디자인
- [x] 다국어 지원
- [x] TypeScript 타입 안전성
- [x] 접근성 (WCAG AA)
- [x] 성능 최적화

### 품질 지표
- **TypeScript 오류**: 0개
- **빌드 성공률**: 100%
- **페이지 로드**: 전체 성공
- **모바일 호환성**: 완전 지원

---

**다음 문서**: III. 백엔드 상세 명세 