type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const LOG_LEVELS = {
  ERROR: 'error' as const,
  WARN: 'warn' as const,
  INFO: 'info' as const,
  DEBUG: 'debug' as const,
};

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private getContext(): Partial<LogEntry> {
    const context: Partial<LogEntry> = {
      timestamp: this.formatTimestamp(),
    };

    if (this.isClient) {
      context.url = window.location.href;
      context.userAgent = navigator.userAgent;
      context.sessionId = this.getSessionId();
    }

    return context;
  }

  private getSessionId(): string {
    if (!this.isClient || typeof sessionStorage === 'undefined') return '';
    
    try {
      let sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem('sessionId', sessionId);
      }
      return sessionId;
    } catch (error) {
      return '';
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.isClient || this.isDevelopment) return;

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // 로깅 실패 시 콘솔에만 출력
      console.error('Failed to send log to remote:', error);
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const baseContext = this.getContext();
    const entry: LogEntry = {
      level,
      message,
      timestamp: baseContext.timestamp!,
      ...(baseContext.userId && { userId: baseContext.userId }),
      ...(baseContext.sessionId && { sessionId: baseContext.sessionId }),
      ...(baseContext.url && { url: baseContext.url }),
      ...(baseContext.userAgent && { userAgent: baseContext.userAgent }),
      ...(context && { context }),
      ...(error && { 
        error: {
          name: error.name,
          message: error.message,
          ...(error.stack && { stack: error.stack }),
        }
      }),
    };

    // 개발 환경에서는 콘솔에 출력
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? console.error : 
                           level === 'warn' ? console.warn : 
                           level === 'debug' ? console.debug : console.log;
      
      consoleMethod(`[${level.toUpperCase()}] ${message}`, {
        context,
        error,
        timestamp: entry.timestamp,
      });
    }

    // 프로덕션 환경에서는 원격 로깅
    if (!this.isDevelopment) {
      this.sendToRemote(entry);
    }

    // 로컬 스토리지에 최근 로그 저장 (클라이언트에서만)
    if (this.isClient) {
      this.saveToLocalStorage(entry);
    }
  }

  private saveToLocalStorage(entry: LogEntry): void {
    if (!this.isClient || typeof localStorage === 'undefined') return;

    try {
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(entry);
      
      // 최근 100개 로그만 유지
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100);
      }
      
      localStorage.setItem('app_logs', JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to save log to localStorage:', error);
    }
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LOG_LEVELS.ERROR, message, context, error);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LOG_LEVELS.WARN, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LOG_LEVELS.INFO, message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LOG_LEVELS.DEBUG, message, context);
  }

  // 사용자 정보 설정
  setUserId(userId: string): void {
    if (this.isClient && typeof sessionStorage !== 'undefined') {
      try {
        sessionStorage.setItem('userId', userId);
      } catch (error) {
        console.error('Failed to set userId:', error);
      }
    }
  }

  // 로컬 로그 가져오기
  getLocalLogs(): LogEntry[] {
    if (!this.isClient || typeof localStorage === 'undefined') return [];
    
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch (error) {
      console.error('Failed to get local logs:', error);
      return [];
    }
  }

  // 로컬 로그 삭제
  clearLocalLogs(): void {
    if (this.isClient && typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('app_logs');
      } catch (error) {
        console.error('Failed to clear local logs:', error);
      }
    }
  }

  // 성능 측정
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // API 요청 로깅
  logApiRequest(method: string, url: string, status: number, duration: number, error?: Error): void {
    const level = status >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;
    const message = `API ${method} ${url} - ${status} (${duration}ms)`;
    
    this.log(level, message, {
      method,
      url,
      status,
      duration,
      type: 'api_request',
    }, error);
  }

  // 사용자 액션 로깅
  logUserAction(action: string, context?: Record<string, any>): void {
    this.info(`User action: ${action}`, {
      ...context,
      type: 'user_action',
    });
  }

  // 페이지 뷰 로깅
  logPageView(path: string): void {
    this.info(`Page view: ${path}`, {
      path,
      type: 'page_view',
    });
  }
}

// 싱글톤 인스턴스
export const logger = new Logger();

// 전역 에러 핸들러 설정
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    logger.error('Global error caught', event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    logger.error('Unhandled promise rejection', event.reason, {
      type: 'unhandled_rejection',
    });
  });
}

export default logger; 