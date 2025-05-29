import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Noto_Sans_KR } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ToasterProvider } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { validateEnvironment } from '@/lib/environment';
import { ErrorBoundary } from '@/components/error-boundary';
import { Suspense } from 'react';
import { Loading } from '@/components/ui/loading';

// 환경변수 초기화 (서버 사이드에서만)
if (typeof window === 'undefined') {
  try {
    validateEnvironment();
  } catch (error) {
    console.warn('Environment validation warning:', error);
  }
}

// 폰트 설정
const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
});

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-korean',
});

export const metadata: Metadata = {
  title: {
    default: 'CryptoTrader - 차세대 암호화폐 거래 플랫폼',
    template: '%s | CryptoTrader'
  },
  description: 'AI 기반 인사이트로 스마트한 암호화폐 거래 경험을 제공하는 전문 플랫폼',
  keywords: ['암호화폐', '비트코인', '거래', 'Flash Trade', 'AI', '블록체인'],
  authors: [{ name: 'CryptoTrader Team' }],
  creator: 'CryptoTrader',
  publisher: 'CryptoTrader',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    title: 'CryptoTrader - 차세대 암호화폐 거래 플랫폼',
    description: 'AI 기반 인사이트로 스마트한 암호화폐 거래 경험을 제공하는 전문 플랫폼',
    siteName: 'CryptoTrader',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CryptoTrader - 차세대 암호화폐 거래 플랫폼',
    description: 'AI 기반 인사이트로 스마트한 암호화폐 거래 경험을 제공하는 전문 플랫폼',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0A0A0B' },
  ],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html 
      lang="ko" 
      className={cn(
        inter.variable,
        jetbrainsMono.variable,
        notoSansKR.variable,
        'dark' // 기본 다크모드
      )}
      suppressHydrationWarning
    >
      <head>
        {/* 성능 최적화 */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* PWA 설정 */}
        <meta name="application-name" content="CryptoTrader" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CryptoTrader" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#0A0A0B" />
        <meta name="msapplication-tap-highlight" content="no" />
        
        {/* iOS 세이프 에리어 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      
      <body 
        className={cn(
          'min-h-screen bg-background-primary text-text-primary',
          'font-sans antialiased',
          'dark-mode-transition' // 부드러운 테마 전환
        )}
      >
        {/* 접근성 개선: 스킵 링크 */}
        <a href="#main-content" className="skip-link">
          메인 콘텐츠로 건너뛰기
        </a>
        
        <ErrorBoundary 
          fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-danger-red mb-4">
                  오류가 발생했습니다
                </h1>
                <p className="text-text-secondary mb-4">
                  페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
                </p>
                <button 
                  onClick={() => window.location.reload()}
                  className="btn btn-primary"
                >
                  새로고침
                </button>
              </div>
            </div>
          }
        >
          <ThemeProvider defaultTheme="dark" storageKey="crypto-trader-theme">
            <ToasterProvider>
              <Providers>
                <Suspense fallback={<Loading text="로딩 중..." />}>
                  <main id="main-content" className="app-layout">
                    {children}
                  </main>
                </Suspense>
              </Providers>
            </ToasterProvider>
          </ThemeProvider>
        </ErrorBoundary>
        
        {/* 디버그 정보 (개발 환경에서만) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 z-50 hidden">
            <div className="glass-card p-2 text-xs text-text-muted">
              <div>Env: {process.env.NODE_ENV}</div>
              <div>Version: 2.0.0</div>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
