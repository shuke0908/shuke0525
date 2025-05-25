import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppState } from '../contexts/AppStateContext';

interface WebSocketConfig {
  url: string;
  protocols?: string | string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  messageQueueSize?: number;
  binaryType?: BinaryType;
}

interface WebSocketMessage {
  id: string;
  type: string;
  data: any;
  timestamp: number;
}

interface WebSocketHookReturn {
  socket: WebSocket | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: WebSocketMessage | null;
  sendMessage: (_type: string, _data: any) => void;
  sendJsonMessage: (_message: any) => void;
  getMessageHistory: () => WebSocketMessage[];
  clearMessageHistory: () => void;
  reconnect: () => void;
  disconnect: () => void;
  subscribeTo: (_channel: string, _callback: (_data: any) => void) => () => void;
}

interface UseWebSocketOptions {
  userId?: string;
  token?: string;
  isAdmin?: boolean;
  onTradeResult?: (result: any) => void;
  onTradeActivity?: (activity: any) => void;
  onSettingsUpdate?: (settings: any) => void;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(url: string, options: UseWebSocketOptions = {}) {
  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setConnectionStatus('connecting');
    
    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;
        onConnect?.();
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          onMessage?.(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = () => {
        setIsConnected(false);
        setConnectionStatus('disconnected');
        onDisconnect?.();

        // 자동 재연결 시도
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (error) => {
        setConnectionStatus('error');
        onError?.(error);
      };
    } catch (error) {
      setConnectionStatus('error');
      console.error('Failed to create WebSocket connection:', error);
    }
  }, [url, onMessage, onConnect, onDisconnect, onError, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
    connect,
    disconnect
  };
}

// 실시간 마켓 데이터 전용 훅
export function useRealTimeMarketData(symbols: string[]) {
  const { subscribeTo, sendMessage, connectionStatus } = useWebSocket({
    url: process.env.REACT_APP_WS_MARKET_URL || 'ws://localhost:8082/market',
  });

  const [marketData, setMarketData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (connectionStatus === 'connected' && symbols.length > 0) {
      // 심볼 구독
      sendMessage('subscribe', { symbols });

      const unsubscribe = subscribeTo('market_data', data => {
        setMarketData(prev => ({
          ...prev,
          [data.symbol]: data,
        }));
      });

      return unsubscribe;
    }
    // 연결되지 않았거나 symbols가 없으면 빈 cleanup 함수 반환
    return () => {};
  }, [connectionStatus, symbols, sendMessage, subscribeTo]);

  return {
    marketData,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
  };
}

// 알림 전용 WebSocket 훅
export function useNotificationSocket() {
  const { subscribeTo, connectionStatus } = useWebSocket({
    url:
      process.env.REACT_APP_WS_NOTIFICATION_URL ||
      'ws://localhost:8082/notifications',
  });

  const { addNotification } = useAppState().actions;

  useEffect(() => {
    if (connectionStatus === 'connected') {
      const unsubscribe = subscribeTo('notification', data => {
        addNotification({
          type: data.type || 'info',
          title: data.title,
          message: data.message,
          read: false,
        });
      });

      return unsubscribe;
    }
    // 연결되지 않으면 빈 cleanup 함수 반환
    return () => {};
  }, [connectionStatus, subscribeTo, addNotification]);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
  };
}
