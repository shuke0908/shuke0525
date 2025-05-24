import { toast } from '@/hooks/use-toast';
import type { ApiError, ValidationError } from '@/types';

// 에러 타입 정의
export class AppError extends Error {
  public statusCode: number;
  public code?: string;
  public details?: Record<string, any>;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || '';
    this.details = details || {};
    this.name = 'AppError';
  }
}

export class ValidationErrorClass extends AppError {
  public errors: ValidationError[];

  constructor(
    errors: ValidationError[],
    message: string = 'Validation failed'
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden access') {
    super(message, 403, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

// 에러 핸들러 유틸리티
export const errorHandler = {
  // API 에러를 표준 형식으로 변환
  formatApiError: (error: any): ApiError => {
    if (error instanceof AppError) {
      return {
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      };
    }

    if (error.response?.data) {
      return {
        message:
          error.response.data.message || error.message || 'Unknown error',
        code: error.response.data.code,
        statusCode: error.response.status,
        details: error.response.data.details,
      };
    }

    return {
      message: error.message || 'Unknown error occurred',
      statusCode: 500,
    };
  },

  // 클라이언트 측 에러 처리
  handleClientError: (error: any, showToast?: (_error: ApiError) => void) => {
    const formattedError = errorHandler.formatApiError(error);

    // 개발 환경에서 콘솔에 에러 로깅
    if (process.env.NODE_ENV === 'development') {
      console.error('Client Error:', formattedError);
      console.error('Original Error:', error);
    }

    // 토스트 알림 표시 (선택적)
    if (showToast) {
      showToast(formattedError);
    }

    return formattedError;
  },

  // 서버 측 에러 처리 (API 라우트용)
  handleServerError: (error: any) => {
    const formattedError = errorHandler.formatApiError(error);

    // 서버 로깅
    console.error('Server Error:', {
      message: formattedError.message,
      code: formattedError.code,
      statusCode: formattedError.statusCode,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });

    return {
      success: false,
      error: formattedError.message,
      code: formattedError.code,
    };
  },

  // React Query 에러 처리
  handleQueryError: (error: any) => {
    const formattedError = errorHandler.formatApiError(error);

    // 특정 에러 코드에 따른 처리
    switch (formattedError.statusCode) {
      case 401:
        // 인증 에러 - 로그인 페이지로 리다이렉트
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        break;
      case 403:
        // 권한 에러 - 접근 금지 페이지로 리다이렉트
        if (typeof window !== 'undefined') {
          window.location.href = '/unauthorized';
        }
        break;
      case 404:
        // 리소스 없음 - 404 페이지로 리다이렉트
        if (typeof window !== 'undefined') {
          window.location.href = '/not-found';
        }
        break;
      default:
        // 기타 에러는 로깅만
        break;
    }

    return formattedError;
  },
};

// 에러 메시지 상수
export const ERROR_MESSAGES = {
  // 인증 관련
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  ACCOUNT_LOCKED: '계정이 잠겨있습니다. 관리자에게 문의하세요.',
  EMAIL_NOT_VERIFIED: '이메일 인증이 필요합니다.',
  TWO_FACTOR_REQUIRED: '2단계 인증이 필요합니다.',

  // 권한 관련
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  ADMIN_ONLY: '관리자만 접근할 수 있습니다.',

  // 입력 검증 관련
  REQUIRED_FIELD: '필수 입력 항목입니다.',
  INVALID_EMAIL: '올바른 이메일 주소를 입력하세요.',
  WEAK_PASSWORD: '비밀번호는 최소 8자 이상이어야 합니다.',
  PASSWORDS_NOT_MATCH: '비밀번호가 일치하지 않습니다.',
  INVALID_AMOUNT: '올바른 금액을 입력하세요.',

  // 거래 관련
  INSUFFICIENT_BALANCE: '잔액이 부족합니다.',
  TRADE_NOT_FOUND: '거래를 찾을 수 없습니다.',
  TRADE_ALREADY_CLOSED: '이미 종료된 거래입니다.',
  MARKET_CLOSED: '시장이 마감되었습니다.',

  // 시스템 관련
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도하세요.',
  NETWORK_ERROR: '네트워크 연결을 확인하세요.',
  RATE_LIMIT_EXCEEDED: '요청 한도를 초과했습니다. 잠시 후 다시 시도하세요.',
  MAINTENANCE_MODE: '시스템 점검 중입니다.',

  // 파일 업로드 관련
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다.',
  INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다.',
  FILE_UPLOAD_FAILED: '파일 업로드에 실패했습니다.',
} as const;

// 유효성 검증 헬퍼
export const validation = {
  email: (email: string): ValidationError | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return { field: 'email', message: ERROR_MESSAGES.REQUIRED_FIELD };
    }
    if (!emailRegex.test(email)) {
      return { field: 'email', message: ERROR_MESSAGES.INVALID_EMAIL };
    }
    return null;
  },

  password: (password: string): ValidationError | null => {
    if (!password) {
      return { field: 'password', message: ERROR_MESSAGES.REQUIRED_FIELD };
    }
    if (password.length < 8) {
      return { field: 'password', message: ERROR_MESSAGES.WEAK_PASSWORD };
    }
    return null;
  },

  amount: (amount: string | number): ValidationError | null => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    if (isNaN(numAmount) || numAmount <= 0) {
      return { field: 'amount', message: ERROR_MESSAGES.INVALID_AMOUNT };
    }
    return null;
  },

  required: (_value: any, fieldName: string): ValidationError | null => {
    if (!_value || (typeof _value === 'string' && _value.trim() === '')) {
      return { field: fieldName, message: ERROR_MESSAGES.REQUIRED_FIELD };
    }
    return null;
  },
};

export function handleApiError(error: unknown): void {
  console.error('API Error:', error);
  
  if (error && typeof error === 'object' && 'message' in error) {
    const apiError = error as ApiError;
    
    toast({
      title: 'Error',
      description: apiError.message || 'An unexpected error occurred',
      variant: 'destructive',
    });
  } else {
    toast({
      title: 'Error', 
      description: 'An unexpected error occurred',
      variant: 'destructive',
    });
  }
}

export function handleValidationError(error: ValidationError): void {
  toast({
    title: 'Validation Error',
    description: error.message || 'Please check your input',
    variant: 'destructive',
  });
}

export default errorHandler;
