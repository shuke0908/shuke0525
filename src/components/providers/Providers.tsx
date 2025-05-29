'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';

// 글로벌 앱 상태 관리
interface AppContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  balance: number;
  avatar?: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

// 앱 Provider
const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 초기 로딩 시뮬레이션
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const value: AppContextType = {
    user,
    isLoading,
    error,
    setUser,
    setError,
    setLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// 거래 상태 관리
interface TradingContextType {
  balance: number;
  activeTrades: Trade[];
  tradingPair: string;
  isTrading: boolean;
  addTrade: (trade: Omit<Trade, 'id' | 'timestamp'>) => void;
  closeTrade: (tradeId: string, result: 'win' | 'loss') => void;
  setTradingPair: (pair: string) => void;
}

interface Trade {
  id: string;
  direction: 'up' | 'down';
  amount: number;
  duration: number;
  startPrice: number;
  currentPrice?: number;
  result?: 'win' | 'loss';
  timestamp: Date;
  asset: string;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (context === undefined) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};

const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState(10000); // 초기 잔액 $10,000
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [tradingPair, setTradingPair] = useState('BTC/USD');
  const [isTrading, setIsTrading] = useState(false);

  const addTrade = (tradeData: Omit<Trade, 'id' | 'timestamp'>) => {
    const newTrade: Trade = {
      ...tradeData,
      id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };

    setActiveTrades(prev => [...prev, newTrade]);
    setBalance(prev => prev - tradeData.amount);
    setIsTrading(true);

    // 거래 시간 후 자동 종료
    setTimeout(() => {
      closeTrade(newTrade.id, Math.random() > 0.5 ? 'win' : 'loss');
    }, tradeData.duration * 1000);
  };

  const closeTrade = (tradeId: string, result: 'win' | 'loss') => {
    setActiveTrades(prev => 
      prev.map(trade => 
        trade.id === tradeId 
          ? { ...trade, result }
          : trade
      )
    );

    const trade = activeTrades.find(t => t.id === tradeId);
    if (trade) {
      if (result === 'win') {
        setBalance(prev => prev + trade.amount * 1.85); // 85% 수익률
      }
    }

    // 5초 후 거래 기록에서 제거
    setTimeout(() => {
      setActiveTrades(prev => prev.filter(trade => trade.id !== tradeId));
      setIsTrading(false);
    }, 5000);
  };

  const value: TradingContextType = {
    balance,
    activeTrades,
    tradingPair,
    isTrading,
    addTrade,
    closeTrade,
    setTradingPair,
  };

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
};

// 메인 Providers 컴포넌트
export const Providers: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <AppProvider>
        <TradingProvider>
          {children}
        </TradingProvider>
      </AppProvider>
    </I18nextProvider>
  );
};

export default Providers; 