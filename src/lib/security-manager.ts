import CryptoJS from 'crypto-js';

// 보안 설정 인터페이스
interface SecurityConfig {
  tokenExpiry: number;
  refreshTokenExpiry: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  passwordMinLength: number;
  enableCSP: boolean;
  enableXSSProtection: boolean;
  enableMFA: boolean;
  sessionTimeout: number;
}

// 기본 보안 설정
const defaultSecurityConfig: SecurityConfig = {
  tokenExpiry: 15 * 60 * 1000, // 15분
  refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7일
  maxLoginAttempts: 5,
  lockoutDuration: 30 * 60 * 1000, // 30분
  passwordMinLength: 8,
  enableCSP: true,
  enableXSSProtection: true,
  enableMFA: true,
  sessionTimeout: 30 * 60 * 1000, // 30분
};

// Content Security Policy 설정
export const setupCSP = () => {
  if (!defaultSecurityConfig.enableCSP) return;

  const cspDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // 개발 환경에서만
      'https://apis.google.com',
      'https://www.google.com',
      'https://www.gstatic.com',
    ],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'img-src': ["'self'", 'data:', 'https:'],
    'connect-src': [
      "'self'",
      'https://api.example.com',
      'wss://socket.example.com',
    ],
    'frame-src': ['https://www.google.com'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'upgrade-insecure-requests': [],
  };

  const cspString = Object.entries(cspDirectives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');

  const metaTag = document.createElement('meta');
  metaTag.httpEquiv = 'Content-Security-Policy';
  metaTag.content = cspString;
  document.head.appendChild(metaTag);
};

// XSS 보호 헤더 설정
export const setupSecurityHeaders = () => {
  if (!defaultSecurityConfig.enableXSSProtection) return;

  // X-Content-Type-Options
  const noSniffMeta = document.createElement('meta');
  noSniffMeta.httpEquiv = 'X-Content-Type-Options';
  noSniffMeta.content = 'nosniff';
  document.head.appendChild(noSniffMeta);

  // X-Frame-Options
  const frameOptionsMeta = document.createElement('meta');
  frameOptionsMeta.httpEquiv = 'X-Frame-Options';
  frameOptionsMeta.content = 'DENY';
  document.head.appendChild(frameOptionsMeta);

  // Referrer Policy
  const referrerMeta = document.createElement('meta');
  referrerMeta.name = 'referrer';
  referrerMeta.content = 'strict-origin-when-cross-origin';
  document.head.appendChild(referrerMeta);
};

// 토큰 관리 클래스
export class TokenManager {
  private static instance: TokenManager;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: number | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // 토큰 설정
  setTokens(accessToken: string, refreshToken: string, expiresIn: number) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.tokenExpiry = Date.now() + expiresIn * 1000;

    // 보안 저장 (HttpOnly 쿠키가 이상적이지만 클라이언트 사이드에서는 암호화된 저장소 사용)
    this.storeTokensSecurely(accessToken, refreshToken, this.tokenExpiry);

    // 자동 갱신 타이머 설정
    this.setupRefreshTimer(expiresIn);
  }

  // 보안 토큰 저장
  private storeTokensSecurely(
    accessToken: string,
    refreshToken: string,
    expiry: number
  ) {
    const key = this.generateStorageKey();
    const data = {
      accessToken,
      refreshToken,
      expiry,
    };

    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(data),
      key
    ).toString();
    sessionStorage.setItem('auth_data', encrypted);
  }

  // 저장소 키 생성
  private generateStorageKey(): string {
    const deviceInfo = navigator.userAgent + navigator.language;
    return CryptoJS.SHA256(deviceInfo).toString();
  }

  // 토큰 복원
  restoreTokens(): boolean {
    try {
      const encrypted = sessionStorage.getItem('auth_data');
      if (!encrypted) return false;

      const key = this.generateStorageKey();
      const decrypted = CryptoJS.AES.decrypt(encrypted, key);
      const data = JSON.parse(decrypted.toString(CryptoJS.enc.Utf8));

      if (Date.now() > data.expiry) {
        this.clearTokens();
        return false;
      }

      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      this.tokenExpiry = data.expiry;

      const remainingTime = Math.max(0, (data.expiry - Date.now()) / 1000);
      this.setupRefreshTimer(remainingTime);

      return true;
    } catch (error) {
      console.error('토큰 복원 실패:', error);
      this.clearTokens();
      return false;
    }
  }

  // 토큰 갱신 타이머 설정
  private setupRefreshTimer(expiresIn: number) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // 만료 5분 전에 갱신 시도
    const refreshTime = Math.max(0, (expiresIn - 300) * 1000);

    this.refreshTimer = setTimeout(async () => {
      await this.refreshAccessToken();
    }, refreshTime);
  }

  // 액세스 토큰 갱신
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.setTokens(data.accessToken, data.refreshToken, data.expiresIn);
        return true;
      } else {
        this.clearTokens();
        window.location.href = '/login';
        return false;
      }
    } catch (error) {
      console.error('토큰 갱신 실패:', error);
      return false;
    }
  }

  // 현재 액세스 토큰 반환
  getAccessToken(): string | null {
    if (this.tokenExpiry && Date.now() > this.tokenExpiry) {
      this.refreshAccessToken();
      return null;
    }
    return this.accessToken;
  }

  // 토큰 유효성 검사
  isTokenValid(): boolean {
    return (
      this.accessToken !== null &&
      this.tokenExpiry !== null &&
      Date.now() < this.tokenExpiry
    );
  }

  // 토큰 제거
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;

    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }

    sessionStorage.removeItem('auth_data');
  }
}

// 입력 검증 및 새니타이제이션
export class InputSanitizer {
  // HTML 태그 제거
  static stripHtml(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // SQL 인젝션 방지 (기본적인 패턴 감지)
  static detectSqlInjection(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /('|(\\)|;|--|\/\*|\*\/)/,
      /(\b(OR|AND)\b.*=.*)/i,
    ];

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  // XSS 패턴 감지
  static detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  // 안전한 입력 검증
  static sanitizeInput(
    input: string,
    options: {
      allowHtml?: boolean;
      maxLength?: number;
      allowedChars?: RegExp;
    } = {}
  ): { isValid: boolean; sanitized: string; errors: string[] } {
    const errors: string[] = [];
    let sanitized = input;

    // 길이 검증
    if (options.maxLength && input.length > options.maxLength) {
      errors.push(`입력 길이가 ${options.maxLength}자를 초과했습니다.`);
      sanitized = sanitized.substring(0, options.maxLength);
    }

    // SQL 인젝션 검사
    if (this.detectSqlInjection(input)) {
      errors.push('잠재적 SQL 인젝션 패턴이 감지되었습니다.');
    }

    // XSS 검사
    if (this.detectXSS(input)) {
      errors.push('잠재적 XSS 패턴이 감지되었습니다.');
    }

    // HTML 제거 (허용되지 않는 경우)
    if (!options.allowHtml) {
      sanitized = this.stripHtml(sanitized);
    }

    // 허용된 문자만 유지
    if (options.allowedChars) {
      const matches = sanitized.match(options.allowedChars);
      sanitized = matches ? matches.join('') : '';
    }

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
    };
  }
}

// 세션 관리
export class SessionManager {
  private static instance: SessionManager;
  private sessionTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private sessionTimeout = 30 * 60 * 1000; // 30분

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  // 세션 시작
  startSession() {
    this.setupSessionTimeout();
    this.setupActivityListeners();
  }

  // 세션 타임아웃 설정
  private setupSessionTimeout() {
    this.resetSessionTimeout();
  }

  // 세션 타임아웃 리셋
  private resetSessionTimeout() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }

    // 5분 전 경고
    this.warningTimer = setTimeout(
      () => {
        this.showSessionWarning();
      },
      this.sessionTimeout - 5 * 60 * 1000
    );

    // 세션 만료
    this.sessionTimer = setTimeout(() => {
      this.expireSession();
    }, this.sessionTimeout);
  }

  // 세션 경고 표시
  private showSessionWarning() {
    const extend = confirm('세션이 5분 후 만료됩니다. 연장하시겠습니까?');
    if (extend) {
      this.resetSessionTimeout();
    }
  }

  // 세션 만료 처리
  private expireSession() {
    alert('세션이 만료되었습니다. 다시 로그인해주세요.');
    TokenManager.getInstance().clearTokens();
    window.location.href = '/login';
  }

  // 활동 리스너 설정
  private setupActivityListeners() {
    const events = ['click', 'keypress', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(
        event,
        () => {
          this.resetSessionTimeout();
        },
        true
      );
    });
  }

  // 세션 종료
  endSession() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
    }
  }
}

// 로그인 시도 제한
export class LoginAttemptLimiter {
  private attempts: Map<string, { count: number; lockUntil: number }> =
    new Map();

  // 로그인 시도 기록
  recordAttempt(identifier: string): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (record && record.lockUntil > now) {
      return false; // 잠금 상태
    }

    if (!record || record.lockUntil <= now) {
      this.attempts.set(identifier, { count: 1, lockUntil: 0 });
      return true;
    }

    record.count += 1;

    if (record.count >= defaultSecurityConfig.maxLoginAttempts) {
      record.lockUntil = now + defaultSecurityConfig.lockoutDuration;
      return false;
    }

    return true;
  }

  // 성공적인 로그인 시 초기화
  resetAttempts(identifier: string) {
    this.attempts.delete(identifier);
  }

  // 잠금 상태 확인
  isLocked(identifier: string): boolean {
    const record = this.attempts.get(identifier);
    return record ? record.lockUntil > Date.now() : false;
  }

  // 남은 잠금 시간 (밀리초)
  getLockTimeRemaining(identifier: string): number {
    const record = this.attempts.get(identifier);
    return record ? Math.max(0, record.lockUntil - Date.now()) : 0;
  }
}

// 보안 이벤트 로깅
export class SecurityLogger {
  private static logs: Array<{
    timestamp: number;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    userAgent: string;
    ip?: string;
  }> = [];

  static log(
    type: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    message: string
  ) {
    const entry = {
      timestamp: Date.now(),
      type,
      severity,
      message,
      userAgent: navigator.userAgent,
    };

    this.logs.push(entry);
    console.warn(`[Security ${severity.toUpperCase()}] ${type}: ${message}`);

    // 중요한 보안 이벤트는 서버로 전송
    if (severity === 'high' || severity === 'critical') {
      this.sendToServer(entry);
    }

    // 로그 크기 제한
    if (this.logs.length > 100) {
      this.logs.shift();
    }
  }

  private static async sendToServer(entry: any) {
    try {
      await fetch('/api/security/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.error('보안 로그 전송 실패:', error);
    }
  }

  static getLogs() {
    return [...this.logs];
  }

  static clearLogs() {
    this.logs = [];
  }
}

// 통합 보안 매니저
export class SecurityManager {
  private tokenManager: TokenManager;
  private sessionManager: SessionManager;
  private loginLimiter: LoginAttemptLimiter;

  constructor() {
    this.tokenManager = TokenManager.getInstance();
    this.sessionManager = SessionManager.getInstance();
    this.loginLimiter = new LoginAttemptLimiter();
  }

  // 초기화
  initialize() {
    setupCSP();
    setupSecurityHeaders();
    this.tokenManager.restoreTokens();
    this.sessionManager.startSession();

    SecurityLogger.log(
      'SECURITY_INIT',
      'low',
      '보안 시스템이 초기화되었습니다.'
    );
  }

  // 정리
  cleanup() {
    this.sessionManager.endSession();
    SecurityLogger.log(
      'SECURITY_CLEANUP',
      'low',
      '보안 시스템이 정리되었습니다.'
    );
  }

  getTokenManager() {
    return this.tokenManager;
  }

  getSessionManager() {
    return this.sessionManager;
  }

  getLoginLimiter() {
    return this.loginLimiter;
  }
}

export default SecurityManager;
