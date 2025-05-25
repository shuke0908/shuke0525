import { useEffect, useRef, useState } from 'react';

interface WebSocketMessage {
  type: string;
  data?: any;
  message?: string;
}

interface UseSimpleWebSocketOptions {
  userId?: string;
  token?: string;
  isAdmin?: boolean;
  onTradeResult?: (result: any) => void;
  onTradeActivity?: (activity: any) => void;
  onSettingsUpdate?: (settings: any) => void;
}

export function useSimpleWebSocket(options: UseSimpleWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);

  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000;

  const connect = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsPort = process.env.NEXT_PUBLIC_WEBSOCKET_PORT || '8082';
      const wsUrl = `ws://localhost:${wsPort}`;
      
      console.log(`🔌 Connecting to WebSocket: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;

        // 구독 메시지 전송
        if (options.isAdmin && options.token) {
          ws.send(JSON.stringify({
            type: 'subscribe_admin',
            token: options.token
          }));
        } else if (options.userId && options.token) {
          ws.send(JSON.stringify({
            type: 'subscribe_user',
            token: options.token,
            userId: options.userId
          }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 WebSocket message:', message);

          switch (message.type) {
            case 'connected':
            case 'subscribed':
              console.log(`✅ ${message.message}`);
              break;

            case 'trade_result':
              if (options.onTradeResult && message.data) {
                options.onTradeResult(message.data);
              }
              break;

            case 'trade_activity':
              if (options.onTradeActivity && message.data) {
                options.onTradeActivity(message.data);
              }
              break;

            case 'settings_updated':
              if (options.onSettingsUpdate && message.data) {
                options.onSettingsUpdate(message.data);
              }
              break;

            case 'error':
              console.error('❌ WebSocket error:', message.message);
              setError(message.message || 'WebSocket 오류가 발생했습니다.');
              break;

            case 'pong':
              // Ping-pong 응답
              break;

            default:
              console.log('🤷 Unknown message type:', message.type);
          }
        } catch (err) {
          console.error('❌ Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;

        // 자동 재연결 시도
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`🔄 Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else {
          setError('WebSocket 연결에 실패했습니다. 페이지를 새로고침해주세요.');
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket 연결 오류가 발생했습니다.');
      };

    } catch (err) {
      console.error('❌ Failed to create WebSocket:', err);
      setError('WebSocket 연결을 생성할 수 없습니다.');
    }
  };

  const disconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setError(null);
  };

  const sendPing = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }
  };

  // 연결 시작
  useEffect(() => {
    if (options.token && (options.userId || options.isAdmin)) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [options.token, options.userId, options.isAdmin]);

  // 주기적 ping 전송 (연결 유지)
  useEffect(() => {
    if (isConnected) {
      const pingInterval = setInterval(sendPing, 30000); // 30초마다
      return () => clearInterval(pingInterval);
    }
  }, [isConnected]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    sendPing
  };
} 