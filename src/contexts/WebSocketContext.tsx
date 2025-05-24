'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  createWebSocketClient,
  type WebSocketClient,
} from '@/lib/websocket-client';
import {
  type WebSocketState,
  type BalanceUpdatedMessage,
  type FlashTradeCompletedMessage,
  type NotificationMessage,
} from '@/types/websocket';
import { queryKeys } from '@/hooks/use-api';

interface WebSocketContextType {
  isConnected: boolean;
  isAuthenticated: boolean;
  connectionState: WebSocketState;
  connect: (_token?: string) => void;
  disconnect: () => void;
  sendMessage: (_message: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

interface WebSocketProviderProps {
  children: ReactNode;
  wsUrl?: string;
}

export function WebSocketProvider({ children, wsUrl }: WebSocketProviderProps) {
  const [wsClient, setWsClient] = useState<WebSocketClient | null>(null);
  const [connectionState, setConnectionState] =
    useState<WebSocketState>('disconnected');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const queryClient = useQueryClient();

  // WebSocket 클라이언트 초기화
  useEffect(() => {
    if (!wsUrl) {
      console.warn('WebSocket URL not provided');
      return;
    }

    const client = createWebSocketClient({
      url: wsUrl,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
    });

    setWsClient(client);

    // 연결 상태 변경 핸들러
    const unsubscribeState = client.onStateChange(state => {
      setConnectionState(state);
      if (state === 'disconnected') {
        setIsAuthenticated(false);
      }
    });

    // 에러 핸들러
    const unsubscribeError = client.onError(error => {
      console.error('WebSocket error:', error);
      toast({
        title: '연결 오류',
        description: '서버와의 연결에 문제가 발생했습니다.',
        variant: 'destructive',
      });
    });

    return () => {
      unsubscribeState();
      unsubscribeError();
      client.disconnect();
    };
  }, [wsUrl]);

  // 메시지 핸들러 설정
  useEffect(() => {
    if (!wsClient) return;

    // 인증 성공 핸들러
    const unsubscribeAuth = wsClient.onMessage('AUTH_SUCCESS', () => {
      setIsAuthenticated(true);
      toast({
        title: '연결 완료',
        description: '실시간 업데이트가 활성화되었습니다.',
        variant: 'default',
      });
    });

    // 잔액 업데이트 핸들러
    const unsubscribeBalance = wsClient.onMessage(
      'BALANCE_UPDATED',
      ((message: BalanceUpdatedMessage) => {
        const { payload } = message;

        // 잔액 쿼리 무효화
        queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });

        // 사용자에게 알림
        const changeText =
          payload.changeAmount > 0
            ? `+${payload.changeAmount.toLocaleString()}`
            : payload.changeAmount.toLocaleString();

        toast({
          title: '잔액 변경',
          description: `${changeText} (${payload.reason})`,
          variant: payload.changeAmount > 0 ? 'default' : 'destructive',
        });
      }) as any
    );

    // Flash Trade 완료 핸들러
    const unsubscribeFlashComplete = wsClient.onMessage(
      'FLASH_TRADE_COMPLETED',
      ((message: FlashTradeCompletedMessage) => {
        const { payload } = message;

        // 관련 쿼리 무효화
        queryClient.invalidateQueries({
          queryKey: queryKeys.activeFlashTrades,
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.flashTradeHistory(),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });

        // 결과 알림
        const resultText = payload.result === 'win' ? '수익' : '손실';
        const profitText =
          payload.profit > 0
            ? `+${payload.profit.toLocaleString()}`
            : payload.profit.toLocaleString();

        toast({
          title: `Flash Trade ${resultText}`,
          description: `거래 결과: ${profitText}`,
          variant: payload.result === 'win' ? 'default' : 'destructive',
        });
      }) as any
    );

    // 입금 상태 변경 핸들러
    const unsubscribeDeposit = wsClient.onMessage(
      'DEPOSIT_STATUS_CHANGED',
      (message: any) => {
        const { payload } = message;

        queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });

        const statusText = payload.status === 'approved' ? '승인' : '거부';
        toast({
          title: `입금 ${statusText}`,
          description: `${payload.amount.toLocaleString()}원 입금이 ${statusText}되었습니다.`,
          variant: payload.status === 'approved' ? 'default' : 'destructive',
        });
      }
    );

    // 출금 상태 변경 핸들러
    const unsubscribeWithdrawal = wsClient.onMessage(
      'WITHDRAWAL_STATUS_CHANGED',
      (message: any) => {
        const { payload } = message;

        const statusText = payload.status === 'approved' ? '승인' : '거부';
        toast({
          title: `출금 ${statusText}`,
          description: `${payload.amount.toLocaleString()}원 출금이 ${statusText}되었습니다.`,
          variant: payload.status === 'approved' ? 'default' : 'destructive',
        });
      }
    );

    // KYC 상태 변경 핸들러
    const unsubscribeKyc = wsClient.onMessage('KYC_STATUS_CHANGED', (message: any) => {
      const { payload } = message;

      const statusText = payload.status === 'approved' ? '승인' : '거부';
      toast({
        title: `신원 인증 ${statusText}`,
        description: payload.reason || `신원 인증이 ${statusText}되었습니다.`,
        variant: payload.status === 'approved' ? 'default' : 'destructive',
      });
    });

    // 일반 알림 핸들러
    const unsubscribeNotification = wsClient.onMessage(
      'NOTIFICATION',
      ((message: NotificationMessage) => {
        const { payload } = message;

        toast({
          title: payload.title,
          description: payload.message,
          variant: payload.level === 'error' ? 'destructive' : 'default',
        });
      }) as any
    );

    // 에러 메시지 핸들러
    const unsubscribeErrorMsg = wsClient.onMessage('ERROR', (message: any) => {
      const { payload } = message;

      toast({
        title: '오류',
        description: payload.message,
        variant: 'destructive',
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeBalance();
      unsubscribeFlashComplete();
      unsubscribeDeposit();
      unsubscribeWithdrawal();
      unsubscribeKyc();
      unsubscribeNotification();
      unsubscribeErrorMsg();
    };
  }, [wsClient, queryClient]);

  // 연결 함수
  const connect = useCallback(
    (_token?: string) => {
      if (wsClient) {
        wsClient.connect(_token);
      }
    },
    [wsClient]
  );

  // 연결 해제 함수
  const disconnect = useCallback(() => {
    if (wsClient) {
      wsClient.disconnect();
    }
  }, [wsClient]);

  // 메시지 전송 함수 (필요한 경우)
  const sendMessage = useCallback((_message: any) => {
    // 현재는 클라이언트에서 서버로 보내는 메시지가 제한적이므로 구현하지 않음
    console.warn('sendMessage is not implemented for security reasons');
  }, []);

  const value: WebSocketContextType = {
    isConnected: connectionState === 'connected',
    isAuthenticated,
    connectionState,
    connect,
    disconnect,
    sendMessage,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

// Hook for using WebSocket context
export function useWebSocket() {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  return context;
}

// Hook for WebSocket connection status
export function useWebSocketStatus() {
  const { isConnected, isAuthenticated, connectionState } = useWebSocket();

  return {
    isConnected,
    isAuthenticated,
    connectionState,
    status:
      isConnected && isAuthenticated
        ? 'connected'
        : isConnected
          ? 'authenticating'
          : connectionState,
  };
}
