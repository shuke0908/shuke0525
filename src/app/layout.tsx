import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { validateEnvironment } from '../lib/environment';
import { APP_INFO } from '../lib/config';
import { Providers } from '../components/providers';

const inter = Inter({ subsets: ['latin'] });

// 서버 사이드에서 환경 변수 검증
if (typeof window === 'undefined') {
  validateEnvironment();
}

export const metadata: Metadata = {
  title: {
    default: APP_INFO.name,
    template: `%s | ${APP_INFO.name}`,
  },
  description: APP_INFO.description,
  keywords: [
    '암호화폐',
    '거래',
    '투자',
    'cryptocurrency',
    'trading',
    'investment',
    'blockchain',
    'bitcoin',
    'ethereum',
  ],
  authors: [{ name: APP_INFO.name }],
  creator: APP_INFO.name,
  publisher: APP_INFO.name,
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    languages: {
      'ko-KR': '/ko',
      'en-US': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    title: APP_INFO.name,
    description: APP_INFO.description,
    siteName: APP_INFO.name,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: APP_INFO.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_INFO.name,
    description: APP_INFO.description,
    images: ['/og-image.png'],
    creator: '@' + APP_INFO.name.toLowerCase(),
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  verification: {
    ...(process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION && { google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION }),
    ...(process.env.NEXT_PUBLIC_YANDEX_VERIFICATION && { yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION }),
    ...(process.env.NEXT_PUBLIC_YAHOO_VERIFICATION && { yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION }),
  },
  category: 'technology',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='ko' suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <main className='min-h-screen bg-background'>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
