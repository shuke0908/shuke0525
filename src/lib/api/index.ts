// 타입 및 에러 클래스 export
export * from './core/types';

// 개별 서비스 클래스 export
export { AuthApiService } from './services/auth.service';
export { UserApiService } from './services/user.service';
export { TradeApiService } from './services/trade.service';
export { AdminApiService } from './services/admin.service';
export { WalletService } from './services/wallet.service';
export { SupportService } from './services/support.service';

// 통합 API 클라이언트
import { AuthApiService } from './services/auth.service';
import { UserApiService } from './services/user.service';
import { TradeApiService } from './services/trade.service';
import { AdminApiService } from './services/admin.service';
import { WalletService } from './services/wallet.service';
import { SupportService } from './services/support.service';

export class ApiClient {
  public auth: AuthApiService;
  public user: UserApiService;
  public trade: TradeApiService;
  public admin: AdminApiService;
  public wallet: WalletService;
  public support: SupportService;

  constructor(customBaseURL?: string) {
    this.auth = new AuthApiService(customBaseURL);
    this.user = new UserApiService(customBaseURL);
    this.trade = new TradeApiService(customBaseURL);
    this.admin = new AdminApiService(customBaseURL);
    this.wallet = new WalletService(customBaseURL);
    this.support = new SupportService(customBaseURL);
  }

  // 인증 토큰 관리 (모든 서비스에 적용)
  setAuthToken(token: string, persistent: boolean = false) {
    this.auth.setAuthToken(token, persistent);
    this.user.setAuthToken(token, persistent);
    this.trade.setAuthToken(token, persistent);
    this.admin.setAuthToken(token, persistent);
    this.wallet.setAuthToken(token, persistent);
    this.support.setAuthToken(token, persistent);
  }

  removeAuthToken() {
    this.auth.removeAuthToken();
    this.user.removeAuthToken();
    this.trade.removeAuthToken();
    this.admin.removeAuthToken();
    this.wallet.removeAuthToken();
    this.support.removeAuthToken();
  }

  // 헬스 체크 (auth 서비스를 통해)
  async healthCheck() {
    return this.auth.healthCheck();
  }
}

// 기본 인스턴스 생성 및 export
export const apiClient = new ApiClient();

// 개별 서비스 인스턴스도 export (하위 호환성)
export const authApi = apiClient.auth;
export const userApi = apiClient.user;
export const tradeApi = apiClient.trade;
export const adminApi = apiClient.admin;
export const walletApi = apiClient.wallet;
export const supportApi = apiClient.support; 