import { BaseApiClient } from '../core/base-client';
import type { SupportedCoin } from '@/types';
import type { PaginationParams, PaginatedResponse } from '../core/types';

export class WalletService extends BaseApiClient {
  constructor(customBaseURL?: string) {
    super(customBaseURL);
  }

  async getBalance(): Promise<{ balance: string }> {
    return this.get<{ balance: string }>('/api/wallet/balance');
  }

  async getTransactions(
    params?: PaginationParams
  ): Promise<PaginatedResponse<any>> {
    return this.getPaginated<any>('/api/wallet/transactions', params);
  }

  async transfer(data: any): Promise<{ message: string }> {
    return this.post<{ message: string }>('/api/wallet/transfer', data, {
      showSuccessToast: true,
    });
  }

  async getDepositsByUserId(userId: string): Promise<{ deposits: any[] }> {
    return this.get<{ deposits: any[] }>(`/api/wallet/deposits/${userId}`);
  }

  async getWithdrawalsByUserId(
    userId: string
  ): Promise<{ withdrawals: any[] }> {
    return this.get<{ withdrawals: any[] }>(`/api/wallet/withdrawals/${userId}`);
  }

  async getActiveSupportedCoins(): Promise<{ coins: SupportedCoin[] }> {
    return this.get<{ coins: SupportedCoin[] }>('/api/wallet/supported-coins');
  }

  async createDeposit(formData: FormData): Promise<{ message: string }> {
    return this.post<{ message: string }>('/api/wallet/deposit', formData, {
      showSuccessToast: true,
      headers: {}, // FormData는 브라우저가 자동으로 Content-Type 설정
    });
  }

  async createWithdrawal(data: any): Promise<{ message: string }> {
    return this.post<{ message: string }>('/api/wallet/withdrawal', data, {
      showSuccessToast: true,
    });
  }

  // 지갑 주소 관련
  async generateDepositAddress(coinSymbol: string): Promise<{ address: string }> {
    return this.post<{ address: string }>('/api/wallet/generate-address', {
      coinSymbol,
    });
  }

  async getDepositAddress(coinSymbol: string): Promise<{ address: string }> {
    return this.get<{ address: string }>(`/api/wallet/deposit-address/${coinSymbol}`);
  }

  // 거래 내역 상세
  async getTransactionDetail(transactionId: string): Promise<any> {
    return this.get<any>(`/api/wallet/transactions/${transactionId}`);
  }

  // 잔액 상세 (코인별)
  async getBalanceDetails(): Promise<{ balances: any[] }> {
    return this.get<{ balances: any[] }>('/api/wallet/balance/details');
  }
} 