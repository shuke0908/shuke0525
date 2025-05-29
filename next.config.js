/** @type {import('next').NextConfig} */

// 환경변수 기본값 강제 설정
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
process.env.NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:8000';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dev-anon-key';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'file:./dev.db';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-32-characters-long';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret';

const path = require('path');

const nextConfig = {
  reactStrictMode: false, // React 18 Strict Mode 비활성화
  swcMinify: true, // SWC 다시 활성화
  output: 'standalone',
  
  // 실험적 기능 - Turbo 모드 비활성화로 충돌 해결
  experimental: {
    // optimizeCss: true, // 일시적으로 비활성화
    optimizePackageImports: ['@radix-ui/react-icons'],
    // turbo 모드를 일시적으로 비활성화하여 Webpack 충돌 해결
    // turbo: {
    //   rules: {
    //     '*.svg': {
    //       loaders: ['@svgr/webpack'],
    //       as: '*.js',
    //     },
    //   },
    // },
    // Turbo 모드 비활성화 (Webpack 충돌 방지)
    turbo: false,
    // 서버 컴포넌트 외부 패키지
    serverComponentsExternalPackages: ['canvas-confetti', 'ws'],
    // 스트릭트 모드
    strictNextHead: false,
    // 이미지 최적화
    esmExternals: 'loose',
  },
  
  // 컴파일러 최적화
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // 이미지 최적화
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 86400, // 24시간
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // 웹팩 설정 - usedExports 충돌 해결
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 서버 사이드에서 self 참조 문제 해결
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Tree shaking 최적화 - 개발 환경에서는 비활성화
    if (!dev) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        sideEffects: false,
      };
    }

    // Code splitting 최적화 - 프로덕션에서만
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // 벤더 라이브러리 분리
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20
          },
          // 공통 컴포넌트 분리
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true
          },
          // API 클라이언트 분리
          api: {
            name: 'api',
            chunks: 'all',
            test: /[\\/]src[\\/]lib[\\/]api[\\/]/,
            priority: 15
          },
          // 트레이딩 모듈 분리
          trading: {
            name: 'trading',
            chunks: 'all',
            test: /[\\/]src[\\/]lib[\\/]trading[\\/]/,
            priority: 15
          },
          // UI 컴포넌트 분리
          ui: {
            name: 'ui',
            chunks: 'all',
            test: /[\\/]src[\\/]components[\\/]ui[\\/]/,
            priority: 15
          }
        }
      };
    }

    // SVG 최적화
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // 모듈 해상도 별칭
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/public': path.resolve(__dirname, './public'),
    };

    // 개발 환경에서만 번들 분석
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer
            ? '../analyze/server.html'
            : '../analyze/client.html',
        })
      );
    }

    // Canvas confetti를 클라이언트 사이드에서만 로드
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }

    // 개발 환경에서 usedExports 최적화 비활성화 (Turbo 충돌 방지)
    if (dev) {
      config.optimization.usedExports = false;
    }

    // 외부 패키지 최적화
    if (!isServer) {
      config.externals = {
        ...config.externals,
        ws: 'ws',
      };
    }

    // 번들 최적화
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      },
    };

    return config;
  },
  
  // TypeScript 설정 (빌드 시 타입 오류 무시)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // ESLint 설정 (경고만 허용)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // 성능 최적화
  poweredByHeader: false,
  compress: true,
  
  // 정적 파일 최적화
  trailingSlash: false,
  
  // 헤더 설정
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // 환경별 설정
  env: {
    CUSTOM_KEY: process.env.NODE_ENV,
    // 클라이언트에서 접근 가능한 환경변수 명시적 설정
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    SESSION_SECRET: process.env.SESSION_SECRET,
  },
  
  // 리다이렉트 설정
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
