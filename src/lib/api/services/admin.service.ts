import { BaseApiClient } from '../core/base-client';
import type { AdminAction, PaginationParams, PaginatedResponse } from '../core/types';

export class AdminApiService extends BaseApiClient {
  constructor(customBaseURL?: string) {
    super(customBaseURL);
  }

  // 기본 액션
  async executeAction(action: AdminAction) {
    return this.post('/api/admin/action', action);
  }

  // 입금 관련
  async getDeposits(params?: any) {
    return this.get('/api/admin/deposits', { params });
  }

  async updateDeposit(depositId: string, data: any) {
    return this.put(`/api/admin/deposits/${depositId}`, data, {
      showSuccessToast: true,
    });
  }

  // 분석 데이터
  async getAnalytics(params?: any) {
    return this.get('/api/admin/analytics', { params });
  }

  // Flash Trade 관리
  async setFlashTradeResult(tradeId: number, result: 'win' | 'lose') {
    return this.post(`/api/admin/flash-trade/${tradeId}/result`, { result }, {
      showSuccessToast: true,
    });
  }

  async updateFlashTradeSettings(userId: number, settings: any) {
    return this.put(`/api/admin/users/${userId}/flash-trade-settings`, settings, {
      showSuccessToast: true,
    });
  }

  async addFlashTradeSetting(setting: any) {
    return this.post('/api/admin/flash-trade/settings', setting, {
      showSuccessToast: true,
    });
  }

  async updateFlashTradeSetting(settingId: number, setting: any) {
    return this.put(`/api/admin/flash-trade/settings/${settingId}`, setting, {
      showSuccessToast: true,
    });
  }

  async deleteFlashTradeSetting(settingId: number) {
    return this.delete(`/api/admin/flash-trade/settings/${settingId}`, {
      showSuccessToast: true,
    });
  }

  // 사용자 관리
  async getUsers(params?: PaginationParams) {
    return this.getPaginated('/api/admin/users', params);
  }

  async getUser(userId: string) {
    return this.get(`/api/admin/users/${userId}`);
  }

  async updateUser(userId: string, data: any) {
    return this.put(`/api/admin/users/${userId}`, data, {
      showSuccessToast: true,
    });
  }

  async deleteUser(userId: string) {
    return this.delete(`/api/admin/users/${userId}`, {
      showSuccessToast: true,
    });
  }

  // Quick Trade 관리
  async setQuickTradeResult(tradeId: number, result: 'win' | 'lose') {
    return this.post(`/api/admin/quick-trade/${tradeId}/result`, { result }, {
      showSuccessToast: true,
    });
  }

  async updateQuickTradeSettings(userId: number, settings: any) {
    return this.put(`/api/admin/users/${userId}/quick-trade-settings`, settings, {
      showSuccessToast: true,
    });
  }

  // 지갑 관리  
  async getUserBalance(userId: string) {
    return this.get(`/api/admin/users/${userId}/balance`);
  }

  async updateUserBalance(userId: string, amount: number, type: 'add' | 'subtract') {
    return this.post(`/api/admin/users/${userId}/balance`, { amount, type }, {
      showSuccessToast: true,
    });
  }

  async getWithdrawals(params?: any) {
    return this.get('/api/admin/withdrawals', { params });
  }

  async updateWithdrawal(withdrawalId: string, data: any) {
    return this.put(`/api/admin/withdrawals/${withdrawalId}`, data, {
      showSuccessToast: true,
    });
  }

  // KYC 관리
  async getKycApplications(params?: any) {
    return this.get('/api/admin/kyc', { params });
  }

  async updateKycApplication(applicationId: string, data: any) {
    return this.put(`/api/admin/kyc/${applicationId}`, data, {
      showSuccessToast: true,
    });
  }

  // 지원 티켓 관리
  async getSupportTickets(params?: any) {
    return this.get('/api/admin/support/tickets', { params });
  }

  async updateSupportTicket(ticketId: string, data: any) {
    return this.put(`/api/admin/support/tickets/${ticketId}`, data, {
      showSuccessToast: true,
    });
  }

  async sendTicketMessage(ticketId: string, message: any) {
    return this.post(`/api/admin/support/tickets/${ticketId}/messages`, message, {
      showSuccessToast: true,
    });
  }

  // 시스템 설정
  async getSystemSettings() {
    return this.get('/api/admin/settings');
  }

  async updateSystemSettings(settings: any) {
    return this.put('/api/admin/settings', settings, {
      showSuccessToast: true,
    });
  }

  // Quant AI 관리
  async getQuantAIInvestments(params?: any) {
    return this.get('/api/admin/quant-ai/investments', { params });
  }

  async updateQuantAIInvestment(investmentId: string, data: any) {
    return this.put(`/api/admin/quant-ai/investments/${investmentId}`, data, {
      showSuccessToast: true,
    });
  }

  async getQuantAIStrategies() {
    return this.get('/api/admin/quant-ai/strategies');
  }

  async updateQuantAIStrategy(strategyId: string, data: any) {
    return this.put(`/api/admin/quant-ai/strategies/${strategyId}`, data, {
      showSuccessToast: true,
    });
  }

  // 푸시 알림
  async sendPushNotification(data: any) {
    return this.post('/api/admin/notifications/push', data, {
      showSuccessToast: true,
    });
  }

  // 대시보드 데이터
  async getDashboardStats() {
    return this.get('/api/admin/dashboard/stats');
  }

  // 로그 관리
  async getLogs(params?: any) {
    return this.get('/api/admin/logs', { params });
  }

  // 데이터 내보내기
  async exportData(type: string, params?: any) {
    return this.get(`/api/admin/export/${type}`, { params });
  }
} 