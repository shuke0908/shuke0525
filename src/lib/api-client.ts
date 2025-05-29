// 새로운 모듈화된 API 클라이언트 전역 인스턴스
import { ApiClient } from './api';

// 전역 API 클라이언트 인스턴스
export const apiClient = new ApiClient();

// 편의를 위한 개별 서비스 export
export const authApi = apiClient.auth;
export const userApi = apiClient.user;
export const tradeApi = apiClient.trade;
export const adminApi = apiClient.admin;
export const walletApi = apiClient.wallet;
export const supportApi = apiClient.support;

// 기본 export
export default apiClient;

// 타입 export
export type { ApiResponse, PaginatedResponse, ApiError } from './api'; 