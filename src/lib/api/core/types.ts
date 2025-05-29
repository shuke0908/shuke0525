// 공통 API 타입 정의
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface RequestOptions {
  showErrorToast?: boolean;
  showSuccessToast?: boolean;
  headers?: Record<string, string>;
  requiresAuth?: boolean;
  requiresCSRF?: boolean;
  timeout?: number;
}

export interface AdminAction {
  action: string;
  params: Record<string, any>;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public _status: number,
    public _code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
} 