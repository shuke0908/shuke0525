# 📊 QuantTrade 모니터링 및 로깅 가이드

## 📋 개요

QuantTrade 플랫폼의 안정적인 운영을 위한 포괄적인 모니터링, 로깅, 에러 추적 시스템 구축 가이드입니다.

### 🎯 모니터링 목표
- ✅ **실시간 시스템 상태 추적**: 플랫폼 가동률 99.9% 이상 유지
- ✅ **성능 최적화**: 응답 시간 500ms 이하 유지
- ✅ **에러 조기 감지**: 문제 발생 시 즉시 알림
- ✅ **사용자 경험 모니터링**: 실제 사용자 경험 추적
- ✅ **보안 이벤트 감지**: 비정상적인 활동 실시간 감지

---

## 🏗️ 모니터링 아키텍처

### 📊 전체 모니터링 스택
```
┌─────────────────────────────────────────────────────────────┐
│                    모니터링 대시보드                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Vercel    │ │   Sentry    │ │   Custom    │           │
│  │ Analytics   │ │   Error     │ │ Dashboard   │           │
│  │             │ │  Tracking   │ │             │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      데이터 수집 계층                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  Frontend   │ │   Backend   │ │  Database   │           │
│  │   Metrics   │ │    Logs     │ │   Metrics   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    QuantTrade Platform                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Next.js   │ │   API       │ │  Supabase   │           │
│  │   Frontend  │ │   Routes    │ │  Database   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 1. Vercel 모니터링

### 1.1 Vercel Analytics 설정

#### 설치 및 설정
```bash
# Vercel Analytics 설치
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

#### 커스텀 이벤트 추적
```typescript
// src/lib/analytics.ts
import { track } from '@vercel/analytics';

export const trackEvent = {
  // 거래 관련 이벤트
  tradeCreated: (data: {
    amount: number;
    direction: 'up' | 'down';
    duration: number;
  }) => {
    track('trade_created', {
      amount: data.amount,
      direction: data.direction,
      duration: data.duration,
    });
  },

  tradeCompleted: (data: {
    result: 'win' | 'lose';
    profit: number;
    duration: number;
  }) => {
    track('trade_completed', {
      result: data.result,
      profit: data.profit,
      duration: data.duration,
    });
  },

  // 사용자 행동 이벤트
  userLogin: (method: 'email' | 'social') => {
    track('user_login', { method });
  },

  pageView: (page: string) => {
    track('page_view', { page });
  },

  // 에러 이벤트
  apiError: (endpoint: string, status: number) => {
    track('api_error', { endpoint, status });
  }
};
```

### 1.2 Vercel 함수 모니터링

#### 함수 성능 추적
```typescript
// src/lib/performance.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // API 응답 시간 측정
  async measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const start = Date.now();
    
    try {
      const result = await apiCall();
      const duration = Date.now() - start;
      
      // 성능 로그
      console.log(JSON.stringify({
        type: 'performance',
        api: name,
        duration,
        status: 'success',
        timestamp: new Date().toISOString()
      }));
      
      return result;
    } catch (error) {
      const duration = Date.now() - start;
      
      console.error(JSON.stringify({
        type: 'performance',
        api: name,
        duration,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }));
      
      throw error;
    }
  }
}
```

---

## 🚨 2. Sentry 에러 추적

### 2.1 Sentry 설정

#### 설치 및 초기 설정
```bash
# Sentry 설치
npm install @sentry/nextjs
```

```javascript
// sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  
  // 성능 모니터링
  tracesSampleRate: 1.0,
  
  // 세션 재생
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // 에러 필터링
  beforeSend(event, hint) {
    // 개발 환경에서는 콘솔에도 출력
    if (process.env.NODE_ENV === 'development') {
      console.error('Sentry Error:', hint.originalException);
    }
    return event;
  },
  
  // 사용자 컨텍스트 설정
  initialScope: {
    tags: {
      component: 'quanttrade-frontend'
    }
  }
});
```

```javascript
// sentry.server.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  
  // 서버 사이드 에러 처리
  beforeSend(event, hint) {
    // 민감한 정보 제거
    if (event.request) {
      delete event.request.headers?.authorization;
      delete event.request.headers?.cookie;
    }
    return event;
  }
});
```

### 2.2 커스텀 에러 추적

#### 에러 래퍼 클래스
```typescript
// src/lib/errorTracking.ts
import * as Sentry from '@sentry/nextjs';

export class ErrorTracker {
  // API 에러 추적
  static trackApiError(
    error: Error,
    context: {
      endpoint: string;
      method: string;
      userId?: string;
      requestData?: any;
    }
  ) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'api_error');
      scope.setContext('api_context', {
        endpoint: context.endpoint,
        method: context.method,
        userId: context.userId
      });
      
      // 민감한 데이터 제거
      if (context.requestData) {
        const sanitizedData = { ...context.requestData };
        delete sanitizedData.password;
        delete sanitizedData.token;
        scope.setContext('request_data', sanitizedData);
      }
      
      Sentry.captureException(error);
    });
  }

  // 거래 에러 추적
  static trackTradeError(
    error: Error,
    tradeData: {
      tradeId?: string;
      userId: string;
      amount: number;
      type: string;
    }
  ) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'trade_error');
      scope.setUser({ id: tradeData.userId });
      scope.setContext('trade_context', {
        tradeId: tradeData.tradeId,
        amount: tradeData.amount,
        type: tradeData.type
      });
      
      Sentry.captureException(error);
    });
  }

  // 인증 에러 추적
  static trackAuthError(
    error: Error,
    context: {
      action: 'login' | 'register' | 'refresh' | 'logout';
      email?: string;
      userAgent?: string;
    }
  ) {
    Sentry.withScope((scope) => {
      scope.setTag('error_type', 'auth_error');
      scope.setContext('auth_context', {
        action: context.action,
        email: context.email ? context.email.replace(/(.{2}).*(@.*)/, '$1***$2') : undefined,
        userAgent: context.userAgent
      });
      
      Sentry.captureException(error);
    });
  }
}
```

### 2.3 성능 모니터링

#### 트랜잭션 추적
```typescript
// src/lib/performance.ts
import * as Sentry from '@sentry/nextjs';

export class PerformanceTracker {
  // 거래 생성 성능 추적
  static async trackTradeCreation<T>(
    operation: () => Promise<T>
  ): Promise<T> {
    return await Sentry.startSpan(
      {
        name: 'trade_creation',
        op: 'trade.create'
      },
      async (span) => {
        try {
          const result = await operation();
          span?.setStatus({ code: 2, message: 'ok' });
          return result;
        } catch (error) {
          span?.setStatus({ code: 2, message: 'internal_error' });
          throw error;
        }
      }
    );
  }

  // 데이터베이스 쿼리 성능 추적
  static async trackDatabaseQuery<T>(
    queryName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return await Sentry.startSpan(
      {
        name: `db.query.${queryName}`,
        op: 'db.query'
      },
      async (span) => {
        const start = Date.now();
        
        try {
          const result = await operation();
          const duration = Date.now() - start;
          
          span?.setData('duration', duration);
          span?.setStatus({ code: 2, message: 'ok' });
          
          return result;
        } catch (error) {
          span?.setStatus({ code: 2, message: 'internal_error' });
          throw error;
        }
      }
    );
  }
}
```

---

## 📝 3. 구조화된 로깅 시스템

### 3.1 로거 클래스 구현

```typescript
// src/lib/logger.ts
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  userId?: string;
  tradeId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;

  constructor() {
    this.logLevel = process.env.NODE_ENV === 'production' 
      ? LogLevel.INFO 
      : LogLevel.DEBUG;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private log(entry: LogEntry): void {
    if (entry.level <= this.logLevel) {
      const logString = JSON.stringify({
        ...entry,
        timestamp: new Date().toISOString()
      });

      switch (entry.level) {
        case LogLevel.ERROR:
          console.error(logString);
          break;
        case LogLevel.WARN:
          console.warn(logString);
          break;
        case LogLevel.INFO:
          console.info(logString);
          break;
        case LogLevel.DEBUG:
          console.debug(logString);
          break;
      }
    }
  }

  // 에러 로그
  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.ERROR,
      message,
      timestamp: new Date().toISOString(),
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      metadata
    });
  }

  // 경고 로그
  warn(message: string, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.WARN,
      message,
      timestamp: new Date().toISOString(),
      metadata
    });
  }

  // 정보 로그
  info(message: string, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.INFO,
      message,
      timestamp: new Date().toISOString(),
      metadata
    });
  }

  // 디버그 로그
  debug(message: string, metadata?: Record<string, any>): void {
    this.log({
      level: LogLevel.DEBUG,
      message,
      timestamp: new Date().toISOString(),
      metadata
    });
  }

  // 거래 관련 로그
  tradeLog(
    level: LogLevel,
    message: string,
    tradeId: string,
    userId: string,
    metadata?: Record<string, any>
  ): void {
    this.log({
      level,
      message,
      timestamp: new Date().toISOString(),
      tradeId,
      userId,
      metadata
    });
  }

  // 인증 관련 로그
  authLog(
    level: LogLevel,
    message: string,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, any>
  ): void {
    this.log({
      level,
      message,
      timestamp: new Date().toISOString(),
      userId,
      sessionId,
      metadata
    });
  }
}

// 전역 로거 인스턴스
export const logger = Logger.getInstance();
```

### 3.2 API 로깅 미들웨어

```typescript
// src/lib/middleware/logging.ts
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export function withLogging(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const start = Date.now();
    const requestId = crypto.randomUUID();
    
    // 요청 로그
    logger.info('API Request', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
    });

    try {
      const response = await handler(req);
      const duration = Date.now() - start;

      // 성공 응답 로그
      logger.info('API Response', {
        requestId,
        status: response.status,
        duration,
        method: req.method,
        url: req.url
      });

      return response;
    } catch (error) {
      const duration = Date.now() - start;

      // 에러 응답 로그
      logger.error('API Error', error as Error, {
        requestId,
        duration,
        method: req.method,
        url: req.url
      });

      throw error;
    }
  };
}
```

### 3.3 거래 로깅

```typescript
// src/lib/tradeLogger.ts
import { logger } from '@/lib/logger';

export class TradeLogger {
  // 거래 생성 로그
  static logTradeCreation(data: {
    tradeId: string;
    userId: string;
    amount: number;
    direction: 'up' | 'down';
    duration: number;
    entryPrice: number;
  }): void {
    logger.tradeLog(
      LogLevel.INFO,
      'Trade Created',
      data.tradeId,
      data.userId,
      {
        amount: data.amount,
        direction: data.direction,
        duration: data.duration,
        entryPrice: data.entryPrice,
        action: 'trade_created'
      }
    );
  }

  // 거래 완료 로그
  static logTradeCompletion(data: {
    tradeId: string;
    userId: string;
    result: 'win' | 'lose';
    profit: number;
    exitPrice: number;
    adminSettings?: any;
  }): void {
    logger.tradeLog(
      LogLevel.INFO,
      'Trade Completed',
      data.tradeId,
      data.userId,
      {
        result: data.result,
        profit: data.profit,
        exitPrice: data.exitPrice,
        adminSettings: data.adminSettings,
        action: 'trade_completed'
      }
    );
  }

  // 거래 에러 로그
  static logTradeError(data: {
    tradeId?: string;
    userId: string;
    error: Error;
    context: string;
  }): void {
    logger.tradeLog(
      LogLevel.ERROR,
      `Trade Error: ${data.context}`,
      data.tradeId || 'unknown',
      data.userId,
      {
        error: data.error.message,
        context: data.context,
        action: 'trade_error'
      }
    );
  }
}
```

---

## 📊 4. 커스텀 모니터링 대시보드

### 4.1 실시간 메트릭 수집

```typescript
// src/lib/metrics.ts
export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export class MetricsCollector {
  private static instance: MetricsCollector;
  private metrics: Metric[] = [];
  private readonly maxMetrics = 1000;

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector();
    }
    return MetricsCollector.instance;
  }

  // 메트릭 기록
  record(name: string, value: number, tags?: Record<string, string>): void {
    const metric: Metric = {
      name,
      value,
      timestamp: Date.now(),
      tags
    };

    this.metrics.push(metric);

    // 메트릭 개수 제한
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // 실시간 로그
    logger.debug('Metric Recorded', { metric });
  }

  // 카운터 증가
  increment(name: string, tags?: Record<string, string>): void {
    this.record(name, 1, tags);
  }

  // 타이밍 메트릭
  timing(name: string, duration: number, tags?: Record<string, string>): void {
    this.record(`${name}.duration`, duration, tags);
  }

  // 게이지 메트릭
  gauge(name: string, value: number, tags?: Record<string, string>): void {
    this.record(`${name}.gauge`, value, tags);
  }

  // 메트릭 조회
  getMetrics(name?: string, since?: number): Metric[] {
    let filtered = this.metrics;

    if (name) {
      filtered = filtered.filter(m => m.name === name);
    }

    if (since) {
      filtered = filtered.filter(m => m.timestamp >= since);
    }

    return filtered;
  }

  // 메트릭 통계
  getStats(name: string, since?: number): {
    count: number;
    sum: number;
    avg: number;
    min: number;
    max: number;
  } {
    const metrics = this.getMetrics(name, since);
    
    if (metrics.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 };
    }

    const values = metrics.map(m => m.value);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      count: metrics.length,
      sum,
      avg: sum / metrics.length,
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }
}

// 전역 메트릭 수집기
export const metrics = MetricsCollector.getInstance();
```

### 4.2 헬스 체크 시스템

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  details?: string;
}

export async function GET() {
  const checks: HealthCheck[] = [];
  const startTime = Date.now();

  // 데이터베이스 헬스 체크
  try {
    const dbStart = Date.now();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    await supabase.from('users').select('count').limit(1);
    
    checks.push({
      service: 'database',
      status: 'healthy',
      responseTime: Date.now() - dbStart
    });
  } catch (error) {
    checks.push({
      service: 'database',
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // 메모리 사용량 체크
  const memoryUsage = process.memoryUsage();
  const memoryStatus = memoryUsage.heapUsed / memoryUsage.heapTotal > 0.9 
    ? 'degraded' 
    : 'healthy';

  checks.push({
    service: 'memory',
    status: memoryStatus,
    responseTime: 0,
    details: `Heap: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB / ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`
  });

  // 전체 상태 결정
  const overallStatus = checks.every(c => c.status === 'healthy') 
    ? 'healthy'
    : checks.some(c => c.status === 'unhealthy')
    ? 'unhealthy'
    : 'degraded';

  const response = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    responseTime: Date.now() - startTime,
    checks,
    version: process.env.npm_package_version || '1.0.0'
  };

  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  
  return NextResponse.json(response, { status: statusCode });
}
```

### 4.3 메트릭 API

```typescript
// src/app/api/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { metrics } from '@/lib/metrics';
import { withAuth } from '@/lib/middleware/auth';

export const GET = withAuth(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const metricName = searchParams.get('name');
  const since = searchParams.get('since');
  const sinceTimestamp = since ? parseInt(since) : Date.now() - 3600000; // 1시간 전

  if (metricName) {
    // 특정 메트릭 통계
    const stats = metrics.getStats(metricName, sinceTimestamp);
    return NextResponse.json({
      metric: metricName,
      period: {
        since: new Date(sinceTimestamp).toISOString(),
        until: new Date().toISOString()
      },
      stats
    });
  } else {
    // 모든 메트릭 목록
    const allMetrics = metrics.getMetrics(undefined, sinceTimestamp);
    const metricNames = [...new Set(allMetrics.map(m => m.name))];
    
    const summary = metricNames.map(name => ({
      name,
      stats: metrics.getStats(name, sinceTimestamp)
    }));

    return NextResponse.json({
      period: {
        since: new Date(sinceTimestamp).toISOString(),
        until: new Date().toISOString()
      },
      metrics: summary
    });
  }
}, ['admin']);
```

---

## 🚨 5. 알림 시스템

### 5.1 알림 매니저

```typescript
// src/lib/alerting.ts
export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: number;
  source: string;
  metadata?: Record<string, any>;
}

export class AlertManager {
  private static instance: AlertManager;
  private alerts: Alert[] = [];
  private webhookUrl?: string;

  constructor() {
    this.webhookUrl = process.env.ALERT_WEBHOOK_URL;
  }

  static getInstance(): AlertManager {
    if (!AlertManager.instance) {
      AlertManager.instance = new AlertManager();
    }
    return AlertManager.instance;
  }

  // 알림 생성
  async createAlert(
    level: Alert['level'],
    title: string,
    message: string,
    source: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const alert: Alert = {
      id: crypto.randomUUID(),
      level,
      title,
      message,
      timestamp: Date.now(),
      source,
      metadata
    };

    this.alerts.push(alert);

    // 로그 기록
    logger.warn('Alert Created', {
      alert: {
        id: alert.id,
        level: alert.level,
        title: alert.title,
        source: alert.source
      }
    });

    // 웹훅 전송 (critical 또는 error 레벨)
    if ((level === 'critical' || level === 'error') && this.webhookUrl) {
      await this.sendWebhook(alert);
    }
  }

  // 웹훅 전송
  private async sendWebhook(alert: Alert): Promise<void> {
    if (!this.webhookUrl) return;

    try {
      await fetch(this.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `🚨 ${alert.level.toUpperCase()}: ${alert.title}`,
          attachments: [
            {
              color: alert.level === 'critical' ? 'danger' : 'warning',
              fields: [
                {
                  title: 'Message',
                  value: alert.message,
                  short: false
                },
                {
                  title: 'Source',
                  value: alert.source,
                  short: true
                },
                {
                  title: 'Time',
                  value: new Date(alert.timestamp).toISOString(),
                  short: true
                }
              ]
            }
          ]
        })
      });
    } catch (error) {
      logger.error('Failed to send webhook alert', error as Error, {
        alertId: alert.id
      });
    }
  }

  // 알림 조회
  getAlerts(level?: Alert['level'], since?: number): Alert[] {
    let filtered = this.alerts;

    if (level) {
      filtered = filtered.filter(a => a.level === level);
    }

    if (since) {
      filtered = filtered.filter(a => a.timestamp >= since);
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp);
  }
}

// 전역 알림 매니저
export const alertManager = AlertManager.getInstance();
```

### 5.2 자동 알림 규칙

```typescript
// src/lib/alertRules.ts
import { alertManager } from './alerting';
import { metrics } from './metrics';

export class AlertRules {
  private static checkInterval = 60000; // 1분마다 체크

  static startMonitoring(): void {
    setInterval(() => {
      this.checkErrorRate();
      this.checkResponseTime();
      this.checkMemoryUsage();
      this.checkTradeVolume();
    }, this.checkInterval);
  }

  // 에러율 체크
  private static checkErrorRate(): void {
    const since = Date.now() - 300000; // 5분 전
    const errorMetrics = metrics.getMetrics('api.error', since);
    const totalMetrics = metrics.getMetrics('api.request', since);

    if (totalMetrics.length > 0) {
      const errorRate = errorMetrics.length / totalMetrics.length;
      
      if (errorRate > 0.1) { // 10% 이상 에러율
        alertManager.createAlert(
          'error',
          'High Error Rate Detected',
          `Error rate is ${(errorRate * 100).toFixed(2)}% over the last 5 minutes`,
          'error_rate_monitor',
          { errorRate, errorCount: errorMetrics.length, totalCount: totalMetrics.length }
        );
      }
    }
  }

  // 응답 시간 체크
  private static checkResponseTime(): void {
    const since = Date.now() - 300000; // 5분 전
    const stats = metrics.getStats('api.response_time', since);

    if (stats.count > 0 && stats.avg > 2000) { // 평균 2초 이상
      alertManager.createAlert(
        'warning',
        'Slow Response Time',
        `Average response time is ${stats.avg.toFixed(0)}ms over the last 5 minutes`,
        'response_time_monitor',
        { averageResponseTime: stats.avg, maxResponseTime: stats.max }
      );
    }
  }

  // 메모리 사용량 체크
  private static checkMemoryUsage(): void {
    const memoryUsage = process.memoryUsage();
    const heapUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;

    if (heapUsagePercent > 90) {
      alertManager.createAlert(
        'critical',
        'High Memory Usage',
        `Heap usage is ${heapUsagePercent.toFixed(1)}%`,
        'memory_monitor',
        { heapUsed: memoryUsage.heapUsed, heapTotal: memoryUsage.heapTotal }
      );
    }
  }

  // 거래량 체크
  private static checkTradeVolume(): void {
    const since = Date.now() - 3600000; // 1시간 전
    const tradeStats = metrics.getStats('trade.created', since);

    if (tradeStats.count === 0) {
      alertManager.createAlert(
        'warning',
        'No Trades in Last Hour',
        'No trades have been created in the last hour',
        'trade_volume_monitor',
        { period: '1 hour' }
      );
    }
  }
}
```

---

## 📱 6. 모니터링 대시보드 UI

### 6.1 관리자 모니터링 페이지

```typescript
// src/app/admin/monitoring/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  checks: Array<{
    service: string;
    status: string;
    responseTime: number;
    details?: string;
  }>;
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 헬스 체크
        const healthRes = await fetch('/api/health');
        const healthData = await healthRes.json();
        setHealth(healthData);

        // 메트릭
        const metricsRes = await fetch('/api/metrics');
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);

        // 알림
        const alertsRes = await fetch('/api/alerts');
        const alertsData = await alertsRes.json();
        setAlerts(alertsData);
      } catch (error) {
        console.error('Failed to fetch monitoring data:', error);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // 30초마다 갱신

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">시스템 모니터링</h1>

      {/* 시스템 상태 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>시스템 상태</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              health?.status === 'healthy' ? 'text-green-600' :
              health?.status === 'degraded' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {health?.status?.toUpperCase() || 'LOADING...'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>활성 알림</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {alerts.filter(a => a.level === 'error' || a.level === 'critical').length}
            </div>
            <p className="text-sm text-gray-600">중요 알림</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>응답 시간</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.responseTime || 0}ms
            </div>
            <p className="text-sm text-gray-600">평균 응답 시간</p>
          </CardContent>
        </Card>
      </div>

      {/* 서비스 상태 */}
      <Card>
        <CardHeader>
          <CardTitle>서비스 상태</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {health?.checks.map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <h3 className="font-medium">{check.service}</h3>
                  {check.details && (
                    <p className="text-sm text-gray-600">{check.details}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className={`font-medium ${
                    check.status === 'healthy' ? 'text-green-600' :
                    check.status === 'degraded' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {check.status}
                  </div>
                  <div className="text-sm text-gray-600">
                    {check.responseTime}ms
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 최근 알림 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 알림</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alerts.slice(0, 10).map((alert, index) => (
              <div key={index} className={`p-3 border-l-4 ${
                alert.level === 'critical' ? 'border-red-500 bg-red-50' :
                alert.level === 'error' ? 'border-red-400 bg-red-50' :
                alert.level === 'warning' ? 'border-yellow-400 bg-yellow-50' :
                'border-blue-400 bg-blue-50'
              }`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">{alert.title}</h4>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 🔧 7. 운영 가이드

### 7.1 일일 모니터링 체크리스트

```markdown
## 📋 일일 모니터링 체크리스트

### 🌅 오전 체크 (09:00)
- [ ] 시스템 전체 상태 확인 (/api/health)
- [ ] 밤사이 발생한 에러 로그 검토
- [ ] 중요 알림 확인 및 처리
- [ ] 데이터베이스 성능 메트릭 확인
- [ ] 사용자 활동 지표 확인

### 🌆 오후 체크 (15:00)
- [ ] 피크 시간대 성능 확인
- [ ] 거래량 및 사용자 활동 모니터링
- [ ] 에러율 및 응답 시간 확인
- [ ] 메모리 사용량 확인

### 🌙 저녁 체크 (21:00)
- [ ] 하루 전체 통계 리뷰
- [ ] 백업 상태 확인
- [ ] 다음날 예상 이슈 검토
- [ ] 알림 규칙 효과성 검토
```

### 7.2 주간 모니터링 리포트

```typescript
// src/lib/weeklyReport.ts
export class WeeklyReportGenerator {
  static async generateReport(): Promise<{
    period: { start: string; end: string };
    summary: {
      totalUsers: number;
      totalTrades: number;
      averageResponseTime: number;
      errorRate: number;
      uptime: number;
    };
    trends: {
      userGrowth: number;
      tradeGrowth: number;
      performanceChange: number;
    };
    issues: Array<{
      date: string;
      issue: string;
      impact: string;
      resolution: string;
    }>;
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 데이터 수집 및 분석 로직
    // ...

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },
      summary: {
        totalUsers: 0, // 실제 데이터로 교체
        totalTrades: 0,
        averageResponseTime: 0,
        errorRate: 0,
        uptime: 99.9
      },
      trends: {
        userGrowth: 0,
        tradeGrowth: 0,
        performanceChange: 0
      },
      issues: []
    };
  }
}
```

### 7.3 장애 대응 절차

```markdown
## 🚨 장애 대응 절차

### 1단계: 장애 감지 (0-5분)
1. 자동 알림 수신 확인
2. 시스템 상태 대시보드 확인
3. 장애 범위 및 영향도 파악
4. 초기 대응팀 소집

### 2단계: 초기 대응 (5-15분)
1. 장애 원인 분석 시작
2. 임시 조치 방안 검토
3. 사용자 공지사항 준비
4. 에스컬레이션 필요성 판단

### 3단계: 복구 작업 (15분-1시간)
1. 복구 계획 수립 및 실행
2. 진행 상황 모니터링
3. 사용자 커뮤니케이션
4. 복구 완료 확인

### 4단계: 사후 분석 (1-24시간)
1. 장애 원인 상세 분석
2. 재발 방지 대책 수립
3. 프로세스 개선 방안 도출
4. 사후 보고서 작성
```

이 모니터링 및 로깅 시스템을 통해 QuantTrade 플랫폼의 안정적인 운영과 지속적인 개선이 가능합니다. 