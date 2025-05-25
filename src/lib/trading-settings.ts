import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 기본 거래 설정
export const DEFAULT_TRADING_SETTINGS = {
  flashTrade: {
    enabled: true,
    minAmount: 10,
    maxAmount: 10000,
    timeOptions: [30, 60, 120, 300],
    defaultWinRate: 50,
    profitRange: { min: 70, max: 80 },
    availableAssets: ['BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'SOL', 'ADA', 'AVAX']
  },
  quickTrade: {
    enabled: true,
    minAmount: 1,
    maxAmount: 50000,
    leverageOptions: [1, 2, 5, 10, 20, 50, 100],
    defaultLeverage: 10,
    maxLeverage: 100,
    tradingPairs: [
      { symbol: 'BTC/USDT', enabled: true, spread: 0.1 },
      { symbol: 'ETH/USDT', enabled: true, spread: 0.1 },
      { symbol: 'BNB/USDT', enabled: true, spread: 0.1 },
      { symbol: 'XRP/USDT', enabled: true, spread: 0.1 },
      { symbol: 'SOL/USDT', enabled: true, spread: 0.1 },
      { symbol: 'ADA/USDT', enabled: true, spread: 0.1 },
      { symbol: 'AVAX/USDT', enabled: true, spread: 0.1 },
      { symbol: 'EUR/USD', enabled: true, spread: 0.05 },
      { symbol: 'GBP/USD', enabled: true, spread: 0.05 },
      { symbol: 'USD/JPY', enabled: true, spread: 0.05 }
    ],
    orderTypes: ['market', 'limit'],
    defaultWinRate: 55,
    profitRange: { min: 75, max: 85 }
  },
  quantAI: {
    enabled: true,
    minAmount: 100,
    maxAmount: 100000,
    strategies: [
      { 
        name: 'conservative', 
        label: '보수적', 
        enabled: true, 
        winRate: 70, 
        profitRange: { min: 60, max: 70 },
        riskLevel: 'low'
      },
      { 
        name: 'balanced', 
        label: '균형', 
        enabled: true, 
        winRate: 65, 
        profitRange: { min: 70, max: 80 },
        riskLevel: 'medium'
      },
      { 
        name: 'aggressive', 
        label: '공격적', 
        enabled: true, 
        winRate: 60, 
        profitRange: { min: 80, max: 95 },
        riskLevel: 'high'
      }
    ],
    investmentDuration: [1, 3, 7, 14, 30],
    defaultDuration: 7,
    availableAssets: ['BTC', 'ETH', 'USDT', 'BNB', 'XRP', 'SOL', 'ADA', 'AVAX']
  },
  wallet: {
    enabled: true,
    supportedCoins: [
      {
        symbol: 'BTC',
        name: 'Bitcoin',
        enabled: true,
        networks: ['Bitcoin'],
        minDeposit: 0.001,
        maxDeposit: 10,
        minWithdraw: 0.001,
        maxWithdraw: 5,
        depositFee: 0,
        withdrawFee: 0.0005,
        confirmations: 3
      },
      {
        symbol: 'ETH',
        name: 'Ethereum',
        enabled: true,
        networks: ['Ethereum', 'BSC'],
        minDeposit: 0.01,
        maxDeposit: 100,
        minWithdraw: 0.01,
        maxWithdraw: 50,
        depositFee: 0,
        withdrawFee: 0.005,
        confirmations: 12
      },
      {
        symbol: 'USDT',
        name: 'Tether USD',
        enabled: true,
        networks: ['Ethereum', 'BSC', 'Tron'],
        minDeposit: 10,
        maxDeposit: 100000,
        minWithdraw: 10,
        maxWithdraw: 50000,
        depositFee: 0,
        withdrawFee: 1,
        confirmations: 1
      },
      {
        symbol: 'BNB',
        name: 'BNB',
        enabled: true,
        networks: ['BSC'],
        minDeposit: 0.01,
        maxDeposit: 1000,
        minWithdraw: 0.01,
        maxWithdraw: 500,
        depositFee: 0,
        withdrawFee: 0.001,
        confirmations: 15
      },
      {
        symbol: 'XRP',
        name: 'Ripple',
        enabled: true,
        networks: ['Ripple'],
        minDeposit: 1,
        maxDeposit: 100000,
        minWithdraw: 1,
        maxWithdraw: 50000,
        depositFee: 0,
        withdrawFee: 0.1,
        confirmations: 1
      },
      {
        symbol: 'SOL',
        name: 'Solana',
        enabled: true,
        networks: ['Solana'],
        minDeposit: 0.1,
        maxDeposit: 10000,
        minWithdraw: 0.1,
        maxWithdraw: 5000,
        depositFee: 0,
        withdrawFee: 0.01,
        confirmations: 1
      },
      {
        symbol: 'ADA',
        name: 'Cardano',
        enabled: true,
        networks: ['Cardano'],
        minDeposit: 5,
        maxDeposit: 100000,
        minWithdraw: 5,
        maxWithdraw: 50000,
        depositFee: 0,
        withdrawFee: 1,
        confirmations: 15
      },
      {
        symbol: 'AVAX',
        name: 'Avalanche',
        enabled: true,
        networks: ['Avalanche'],
        minDeposit: 0.1,
        maxDeposit: 10000,
        minWithdraw: 0.1,
        maxWithdraw: 5000,
        depositFee: 0,
        withdrawFee: 0.01,
        confirmations: 1
      }
    ]
  },
  global: {
    maintenanceMode: false,
    tradingEnabled: true,
    newRegistrationEnabled: true,
    kycRequired: false,
    maxDailyTrades: 100,
    maxDailyVolume: 1000000,
    defaultCurrency: 'USD',
    timezone: 'UTC'
  }
};

/**
 * 거래 설정 조회
 */
export async function getTradingSettings() {
  try {
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', 'trading_settings')
      .single();

    return settings?.setting_value || DEFAULT_TRADING_SETTINGS;
  } catch (error) {
    console.error('Failed to fetch trading settings:', error);
    return DEFAULT_TRADING_SETTINGS;
  }
}

/**
 * Flash Trade 설정 조회
 */
export async function getFlashTradeSettings() {
  const settings = await getTradingSettings();
  return settings.flashTrade || DEFAULT_TRADING_SETTINGS.flashTrade;
}

/**
 * Quick Trade 설정 조회
 */
export async function getQuickTradeSettings() {
  const settings = await getTradingSettings();
  return settings.quickTrade || DEFAULT_TRADING_SETTINGS.quickTrade;
}

/**
 * Quant AI 설정 조회
 */
export async function getQuantAISettings() {
  const settings = await getTradingSettings();
  return settings.quantAI || DEFAULT_TRADING_SETTINGS.quantAI;
}

/**
 * 지갑 설정 조회
 */
export async function getWalletSettings() {
  const settings = await getTradingSettings();
  return settings.wallet || DEFAULT_TRADING_SETTINGS.wallet;
}

/**
 * 전역 설정 조회
 */
export async function getGlobalSettings() {
  const settings = await getTradingSettings();
  return settings.global || DEFAULT_TRADING_SETTINGS.global;
}

/**
 * 특정 거래 쌍이 활성화되어 있는지 확인
 */
export async function isTradingPairEnabled(symbol: string) {
  const quickTradeSettings = await getQuickTradeSettings();
  const pair = quickTradeSettings.tradingPairs.find(p => p.symbol === symbol);
  return pair?.enabled || false;
}

/**
 * 특정 자산이 지원되는지 확인
 */
export async function isAssetSupported(asset: string, system: 'flashTrade' | 'quantAI') {
  const settings = await getTradingSettings();
  const systemSettings = settings[system];
  return systemSettings?.availableAssets?.includes(asset) || false;
}

/**
 * 레버리지가 허용되는지 확인
 */
export async function isLeverageAllowed(leverage: number) {
  const quickTradeSettings = await getQuickTradeSettings();
  return quickTradeSettings.leverageOptions.includes(leverage);
}

/**
 * 거래 금액이 유효한지 확인
 */
export async function validateTradeAmount(amount: number, system: 'flashTrade' | 'quickTrade' | 'quantAI') {
  const settings = await getTradingSettings();
  const systemSettings = settings[system];
  
  if (!systemSettings) return false;
  
  return amount >= systemSettings.minAmount && amount <= systemSettings.maxAmount;
}

/**
 * 거래 시간이 유효한지 확인 (Flash Trade용)
 */
export async function validateTradeDuration(duration: number) {
  const flashTradeSettings = await getFlashTradeSettings();
  return flashTradeSettings.timeOptions.includes(duration);
}

/**
 * 코인이 지갑에서 지원되는지 확인
 */
export async function isCoinSupported(symbol: string) {
  const walletSettings = await getWalletSettings();
  const coin = walletSettings.supportedCoins.find(c => c.symbol === symbol);
  return coin?.enabled || false;
}

/**
 * 코인의 최소/최대 입출금 한도 조회
 */
export async function getCoinLimits(symbol: string) {
  const walletSettings = await getWalletSettings();
  const coin = walletSettings.supportedCoins.find(c => c.symbol === symbol);
  
  if (!coin) {
    throw new Error(`Coin ${symbol} is not supported`);
  }
  
  return {
    minDeposit: coin.minDeposit,
    maxDeposit: coin.maxDeposit,
    minWithdraw: coin.minWithdraw,
    maxWithdraw: coin.maxWithdraw,
    withdrawFee: coin.withdrawFee,
    confirmations: coin.confirmations
  };
}

/**
 * 시스템이 활성화되어 있는지 확인
 */
export async function isSystemEnabled(system: 'flashTrade' | 'quickTrade' | 'quantAI' | 'wallet') {
  const settings = await getTradingSettings();
  return settings[system]?.enabled || false;
}

/**
 * 전역 유지보수 모드 확인
 */
export async function isMaintenanceMode() {
  const globalSettings = await getGlobalSettings();
  return globalSettings.maintenanceMode || false;
}

/**
 * 거래가 전역적으로 활성화되어 있는지 확인
 */
export async function isTradingEnabled() {
  const globalSettings = await getGlobalSettings();
  return globalSettings.tradingEnabled || false;
} 