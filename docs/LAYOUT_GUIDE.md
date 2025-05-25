# 🎨 레이아웃 시스템 사용 가이드

## 📋 개요

이 문서는 CryptoTrader 프로젝트의 새로운 통합 레이아웃 시스템 사용법을 설명합니다. 프롬프트 요구사항에 따라 구현된 이 시스템은 일관되고 반응형인 사용자 경험을 제공합니다.

## 🏗️ 레이아웃 구조

### 기본 구성 요소

1. **AppLayout** - 메인 레이아웃 컨테이너
2. **Sidebar** - 왼쪽 고정 사이드바
3. **Header** - 상단 헤더 (선택적)
4. **MobileSidebar** - 모바일 오버레이 사이드바

### 레이아웃 계층 구조

```
AppLayout
├── Sidebar (데스크톱/태블릿)
├── MobileSidebar (모바일)
├── Header (선택적)
└── Main Content Area
    ├── Page Title
    └── Page Content
```

## 🚀 기본 사용법

### 1. 사용자 페이지

```tsx
import { AppLayout } from "@/components/layout";

export default function UserPage() {
  return (
    <AppLayout 
      title="페이지 제목"
      description="페이지 설명"
      variant="user"
    >
      {/* 페이지 콘텐츠 */}
      <div>사용자 페이지 내용</div>
    </AppLayout>
  );
}
```

### 2. 관리자 페이지

```tsx
import { AppLayout } from "@/components/layout";

export default function AdminPage() {
  return (
    <AppLayout 
      title="관리자 페이지"
      description="관리자 전용 기능"
      variant="admin"
    >
      {/* 관리자 페이지 콘텐츠 */}
      <div>관리자 페이지 내용</div>
    </AppLayout>
  );
}
```

## ⚙️ AppLayout Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | 페이지 콘텐츠 |
| `title` | `string` | - | 페이지 제목 |
| `description` | `string` | - | 페이지 설명 |
| `showHeader` | `boolean` | `true` | 헤더 표시 여부 |
| `sidebarVariant` | `"user" \| "admin"` | `"user"` | 사이드바 타입 |
| `className` | `string` | - | 추가 CSS 클래스 |

## 📱 반응형 동작

### 데스크톱/태블릿 (768px 이상)
- 왼쪽 고정 사이드바 (240px 너비)
- 상단 헤더 (선택적)
- 메인 콘텐츠 영역 (나머지 공간)

### 모바일 (768px 미만)
- 사이드바 숨김 (기본)
- 햄버거 메뉴 버튼으로 사이드바 토글
- 오버레이 형태의 모바일 사이드바
- 외부 클릭 시 자동 닫힘

## 🎯 사이드바 메뉴 구성

### 사용자 메뉴
- **대시보드**: 메인 대시보드
- **거래**: 일반 거래, 초단기 거래, AI 자동매매
- **계정**: 지갑, KYC 인증, 알림 센터, 고객센터

### 관리자 메뉴
- **대시보드**: 관리자 대시보드
- **모니터링**: Flash Trades, Active Investments
- **대기 중인 요청**: KYC, 입금, 출금, 고객센터
- **관리**: 회원 관리, 관리자 권한
- **설정**: 시스템 설정 (접을 수 있는 메뉴)

## 🎨 테마 시스템

### 테마 프로바이더 설정

```tsx
import { ThemeProvider } from "@/lib/ThemeProvider";

<ThemeProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem
  storageKey="cryptotrader-theme"
>
  {children}
</ThemeProvider>
```

### 테마 토글 사용

```tsx
import { ModeToggle } from "@/components/ui/mode-toggle";

<ModeToggle />
```

## 🔧 커스터마이징

### 1. 사이드바 메뉴 추가

`src/components/layout/Sidebar.tsx`에서 메뉴 섹션을 수정:

```tsx
const userMenuSections: MenuSection[] = [
  // 기존 섹션들...
  {
    title: "새로운 섹션",
    items: [
      { name: "새 메뉴", path: "/new-menu", icon: NewIcon },
    ],
  },
];
```

### 2. 헤더 기능 추가

`src/components/layout/Header.tsx`에서 헤더 요소를 수정:

```tsx
// 새로운 헤더 버튼 추가
<Button variant="ghost" size="icon">
  <NewIcon className="h-5 w-5" />
</Button>
```

### 3. 스타일 커스터마이징

Tailwind CSS 클래스를 사용하여 스타일 조정:

```tsx
<AppLayout 
  className="custom-padding"
  // 기타 props...
>
```

## 📋 베스트 프랙티스

### 1. 페이지 제목과 설명
- 모든 페이지에 명확한 제목과 설명 제공
- SEO를 위해 Helmet 메타데이터 활용

### 2. 접근성
- 키보드 네비게이션 지원
- 스크린 리더를 위한 적절한 ARIA 레이블
- 충분한 색상 대비

### 3. 성능 최적화
- 레이아웃 컴포넌트의 메모이제이션
- 불필요한 리렌더링 방지
- 이미지 최적화

### 4. 일관성 유지
- 동일한 레이아웃 패턴 사용
- 일관된 간격과 타이포그래피
- 통일된 아이콘 스타일

## 🐛 문제 해결

### 1. 사이드바가 표시되지 않음
- `variant` prop이 올바르게 설정되었는지 확인
- 인증 상태 확인
- CSS 클래스 충돌 확인

### 2. 모바일에서 사이드바가 닫히지 않음
- `onClose` 함수가 올바르게 전달되었는지 확인
- Sheet 컴포넌트의 `onOpenChange` 이벤트 확인

### 3. 테마가 적용되지 않음
- ThemeProvider가 올바르게 설정되었는지 확인
- CSS 변수가 정의되었는지 확인
- 브라우저 캐시 클리어

## 📚 관련 파일

- `src/components/layout/AppLayout.tsx` - 메인 레이아웃
- `src/components/layout/Sidebar.tsx` - 사이드바
- `src/components/layout/Header.tsx` - 헤더
- `src/components/layout/MobileSidebar.tsx` - 모바일 사이드바
- `src/lib/ThemeProvider.tsx` - 테마 프로바이더
- `src/components/ui/mode-toggle.tsx` - 테마 토글

## 🔄 마이그레이션 가이드

### 기존 Layout에서 AppLayout으로 변경

**Before:**
```tsx
import Layout from "@/components/Layout";

<Layout title="제목" subtitle="부제목">
  {children}
</Layout>
```

**After:**
```tsx
import { AppLayout } from "@/components/layout";

<AppLayout title="제목" description="부제목" variant="user">
  {children}
</AppLayout>
```

### 기존 AdminLayoutWithSidebar에서 AppLayout으로 변경

**Before:**
```tsx
import AdminLayoutWithSidebar from "@/components/AdminLayoutWithSidebar";

<AdminLayoutWithSidebar title="제목" description="설명">
  {children}
</AdminLayoutWithSidebar>
```

**After:**
```tsx
import { AppLayout } from "@/components/layout";

<AppLayout title="제목" description="설명" variant="admin">
  {children}
</AppLayout>
```

이 가이드를 통해 새로운 레이아웃 시스템을 효과적으로 활용하여 일관되고 사용자 친화적인 인터페이스를 구축할 수 있습니다. 