import { BaseApiClient } from '../core/base-client';
import type { UserProfile } from '@/types';

export class AuthApiService extends BaseApiClient {
  constructor(customBaseURL?: string) {
    super(customBaseURL);
  }

  async login(credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
    captchaToken?: string;
  }): Promise<{ user: UserProfile; token: string }> {
    const response = await this.post<{ user: UserProfile; token: string }>(
      '/api/auth/login',
      credentials,
      {
        requiresAuth: false,
        showSuccessToast: true,
      }
    );

    // 로그인 성공 시 토큰 저장
    if (response.token) {
      this.setAuthToken(response.token, credentials.rememberMe);
    }

    return response;
  }

  async register(userData: any): Promise<{ user: UserProfile; token: string }> {
    const response = await this.post<{ user: UserProfile; token: string }>(
      '/api/auth/register',
      userData,
      {
        requiresAuth: false,
        showSuccessToast: true,
      }
    );

    // 회원가입 성공 시 토큰 저장
    if (response.token) {
      this.setAuthToken(response.token);
    }

    return response;
  }

  async logout(): Promise<void> {
    await this.post<void>('/api/auth/logout', undefined, {
      showSuccessToast: true,
    });

    // 로그아웃 시 토큰 제거
    this.removeAuthToken();
  }

  async getProfile(): Promise<UserProfile> {
    return this.get<UserProfile>('/api/auth/profile');
  }

  async refreshToken(): Promise<{ token: string }> {
    return this.post<{ token: string }>('/api/auth/refresh');
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    return this.post<{ message: string }>(
      '/api/auth/forgot-password',
      { email },
      {
        requiresAuth: false,
        showSuccessToast: true,
      }
    );
  }

  async resetPassword(
    token: string,
    password: string
  ): Promise<{ message: string }> {
    return this.post<{ message: string }>(
      '/api/auth/reset-password',
      { token, password },
      {
        requiresAuth: false,
        showSuccessToast: true,
      }
    );
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    return this.post<{ message: string }>(
      '/api/auth/verify-email',
      { token },
      {
        requiresAuth: false,
        showSuccessToast: true,
      }
    );
  }

  async verifyTwoFactor(token: string): Promise<{ verified: boolean }> {
    return this.post<{ verified: boolean }>('/api/auth/verify-2fa', {
      token,
    });
  }

  async setup2FA(): Promise<{ qrCode: string; secret: string }> {
    return this.post<{ qrCode: string; secret: string }>('/api/auth/setup-2fa');
  }

  async enable2FA(token: string): Promise<{ message: string }> {
    return this.post<{ message: string }>('/api/auth/enable-2fa', { token });
  }

  async disable2FA(token: string): Promise<{ message: string }> {
    return this.post<{ message: string }>('/api/auth/disable-2fa', { token });
  }

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ message: string }> {
    return this.post<{ message: string }>('/api/auth/change-password', data, {
      showSuccessToast: true,
    });
  }
} 