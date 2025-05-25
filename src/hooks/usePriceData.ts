import { useState } from 'react';
import { useWebSocket } from './useWebSocket';

interface PriceData {
  [symbol: string]: number;
}

interface FlashTradeData {
  totalVolume: number;
  activeTrades: number;
  successRate: number;
  avgProfit: string;
}

export function usePriceData() {
  const [prices, setPrices] = useState<PriceData>({});
  const [flashTradeData, setFlashTradeData] = useState<FlashTradeData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  const wsUrl = `ws://localhost:${process.env.NEXT_PUBLIC_WEBSOCKET_PORT || 8082}`;

  const { isConnected, connectionStatus, sendMessage } = useWebSocket(wsUrl, {
    onMessage: (message) => {
      switch (message.type) {
        case 'price_update':
          setPrices(message.data);
          setLastUpdate(message.timestamp || new Date().toISOString());
          break;
        case 'flash_trade_update':
          setFlashTradeData(message.data);
          break;
        default:
          break;
      }
    },
    onConnect: () => {
      console.log('Price data WebSocket connected');
      // 가격 데이터 구독
      sendMessage({
        type: 'subscribe',
        data: { symbols: ['BTC/USD', 'ETH/USD', 'XRP/USD', 'BNB/USD', 'USDT/USD'] }
      });
    },
    onDisconnect: () => {
      console.log('Price data WebSocket disconnected');
    },
    onError: (error) => {
      console.error('Price data WebSocket error:', error);
    }
  });

  const getPrice = (symbol: string): number => {
    return prices[symbol] || 0;
  };

  const getPriceChange = (symbol: string, timeframe: '24h' | '7d' = '24h'): number => {
    // 실제 구현에서는 과거 가격 데이터와 비교
    // 여기서는 시뮬레이션된 변화율 반환
    const baseChange = Math.random() * 10 - 5; // -5% ~ +5%
    return timeframe === '7d' ? baseChange * 2 : baseChange;
  };

  return {
    prices,
    flashTradeData,
    lastUpdate,
    isConnected,
    connectionStatus,
    getPrice,
    getPriceChange
  };
} 