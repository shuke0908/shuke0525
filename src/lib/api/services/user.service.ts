import { BaseApiClient } from '../core/base-client';
import type { UserProfile } from '@/types';
import type { PaginationParams, PaginatedResponse } from '../core/types';

export class UserApiService extends BaseApiClient {
  constructor(customBaseURL?: string) {
    super(customBaseURL);
  }

  async getProfile(): Promise<UserProfile> {
    return this.get<UserProfile>('/api/user/profile');
  }

  async updateProfile(data: any): Promise<UserProfile> {
    return this.put<UserProfile>('/api/user/profile', data, {
      showSuccessToast: true,
    });
  }

  async getTransactions(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.getPaginated<any>('/api/user/transactions', params);
  }

  async getBalance(): Promise<{ balance: string }> {
    return this.get<{ balance: string }>('/api/user/balance');
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return this.post<{ message: string }>('/api/user/change-password', data, {
      showSuccessToast: true,
    });
  }

  async uploadAvatar(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string }> {
    return this.uploadFile<{ url: string }>(
      '/api/user/avatar',
      file,
      undefined,
      onProgress,
      {
        showSuccessToast: true,
      }
    );
  }

  async setWithdrawalPassword(payload: {
    newWithdrawalPassword: string;
    confirmNewWithdrawalPassword: string;
    currentPassword?: string;
  }): Promise<{ message: string }> {
    return this.post<{ message: string }>(
      '/api/user/withdrawal-password',
      payload,
      {
        showSuccessToast: true,
      }
    );
  }

  async verifyWithdrawalPassword(
    password: string
  ): Promise<{ verified: boolean }> {
    return this.post<{ verified: boolean }>(
      '/api/user/verify-withdrawal-password',
      { password }
    );
  }

  async getKycStatus(): Promise<{ status: string; documents: any[] }> {
    return this.get<{ status: string; documents: any[] }>('/api/user/kyc/status');
  }

  async submitIdVerification(file: File): Promise<{ message: string }> {
    return this.uploadFile<{ message: string }>(
      '/api/user/kyc/id-verification',
      file,
      undefined,
      undefined,
      {
        showSuccessToast: true,
      }
    );
  }

  async submitAddressVerification(file: File): Promise<{ message: string }> {
    return this.uploadFile<{ message: string }>(
      '/api/user/kyc/address-verification',
      file,
      undefined,
      undefined,
      {
        showSuccessToast: true,
      }
    );
  }

  async getActiveInvestments(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.getPaginated<any>('/api/user/investments/active', params);
  }

  async getInvestmentHistory(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.getPaginated<any>('/api/user/investments/history', params);
  }

  // 알림 관련
  async getNotifications(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.getPaginated<any>('/api/user/notifications', params);
  }

  async markNotificationAsRead(notificationId: number): Promise<{ message: string }> {
    return this.patch<{ message: string }>(
      `/api/user/notifications/${notificationId}/read`
    );
  }

  async markAllNotificationsAsRead(): Promise<{ message: string }> {
    return this.patch<{ message: string }>('/api/user/notifications/read-all');
  }

  // 보안 설정
  async getSecuritySettings(): Promise<any> {
    return this.get<any>('/api/user/security/settings');
  }

  async updateSecuritySettings(data: any): Promise<{ message: string }> {
    return this.put<{ message: string }>('/api/user/security/settings', data, {
      showSuccessToast: true,
    });
  }
} 