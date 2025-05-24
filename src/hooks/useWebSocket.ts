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

export function useWebSocket(config: WebSocketConfig): WebSocketHookReturn {
  const { actions } = useAppState();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const messageHistory = useRef<WebSocketMessage[]>([]);
  const messageQueue = useRef<any[]>([]);
  const subscriptions = useRef<Map<string, ((_data: any) => void)[]>>(new Map());
  const socketRef = useRef<WebSocket | null>(null);

  const {
    url,
    protocols,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    heartbeatInterval = 30000,
    messageQueueSize = 100,
    binaryType = 'blob',
  } = config;

  // 메시지 히스토리 관리
  const addToHistory = useCallback(
    (message: WebSocketMessage) => {
      messageHistory.current = [
        message,
        ...messageHistory.current.slice(0, messageQueueSize - 1),
      ];
    },
    [messageQueueSize]
  );

  const getMessageHistory = useCallback(() => messageHistory.current, []);
  const clearMessageHistory = useCallback(() => {
    messageHistory.current = [];
  }, []);

  // 구독 관리
  const subscribeTo = useCallback(
    (_channel: string, _callback: (_data: any) => void) => {
      if (!subscriptions.current.has(_channel)) {
        subscriptions.current.set(_channel, []);
      }
      subscriptions.current.get(_channel)!.push(_callback);

      // 구독 해제 함수 반환
      return () => {
        const callbacks = subscriptions.current.get(_channel);
        if (callbacks) {
          const index = callbacks.indexOf(_callback);
          if (index > -1) {
            callbacks.splice(index, 1);
          }
          if (callbacks.length === 0) {
            subscriptions.current.delete(_channel);
          }
        }
      };
    },
    []
  );

  // 메시지 발송
  const sendMessage = useCallback(
    (type: string, data: any) => {
      const message = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        data,
        timestamp: Date.now(),
      };

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        // 연결이 없으면 큐에 저장
        messageQueue.current.push(message);
      }
    },
    [socket]
  );

  const sendJsonMessage = useCallback(
    (message: any) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(message));
      } else {
        messageQueue.current.push(message);
      }
    },
    [socket]
  );

  // 대기 중인 메시지 전송
  const flushMessageQueue = useCallback(() => {
    while (
      messageQueue.current.length > 0 &&
      socket &&
      socket.readyState === WebSocket.OPEN
    ) {
      const message = messageQueue.current.shift();
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  // 하트비트 설정
  const setupHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        sendMessage('ping', { timestamp: Date.now() });
      }
    }, heartbeatInterval);
  }, [socket, heartbeatInterval, sendMessage]);

  // WebSocket 연결 생성
  const connect = useCallback(() => {
    try {
      setConnectionStatus('connecting');

      const ws = new WebSocket(url, protocols);
      ws.binaryType = binaryType;
      socketRef.current = ws;

      ws.onopen = () => {
        console.log('WebSocket 연결됨:', url);
        setSocket(ws);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;

        // 대기 중인 메시지 전송
        flushMessageQueue();

        // 하트비트 설정
        setupHeartbeat();
      };

      ws.onclose = event => {
        console.log('WebSocket 연결 종료:', event.code, event.reason);
        setSocket(null);
        setConnectionStatus('disconnected');

        // 하트비트 정리
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current);
        }

        // 자동 재연결 시도
        if (
          reconnectAttempts.current < maxReconnectAttempts &&
          !event.wasClean
        ) {
          reconnectAttempts.current++;
          console.log(
            `재연결 시도 ${reconnectAttempts.current}/${maxReconnectAttempts}`
          );

          reconnectTimeoutRef.current = setTimeout(
            () => {
              connect();
            },
            reconnectInterval * Math.pow(2, reconnectAttempts.current - 1)
          ); // 지수 백오프
        }
      };

      ws.onerror = error => {
        console.error('WebSocket 오류:', error);
        setConnectionStatus('error');
      };

      ws.onmessage = event => {
        try {
          const rawData =
            typeof event.data === 'string'
              ? JSON.parse(event.data)
              : event.data;

          const message: WebSocketMessage = {
            id: rawData.id || Math.random().toString(36).substr(2, 9),
            type: rawData.type || 'message',
            data: rawData.data || rawData,
            timestamp: rawData.timestamp || Date.now(),
          };

          setLastMessage(message);
          addToHistory(message);

          // 구독자들에게 메시지 전달
          if (message.type && subscriptions.current.has(message.type)) {
            const callbacks = subscriptions.current.get(message.type);
            callbacks?.forEach(callback => {
              try {
                callback(message.data);
              } catch (error) {
                console.error('구독 콜백 오류:', error);
              }
            });
          }

          // 특별한 메시지 타입 처리
          switch (message.type) {
            case 'pong':
              // 하트비트 응답 처리
              break;
            case 'market_data':
              actions.updateMarketData(message.data.symbol, message.data);
              break;
            case 'notification':
              actions.addNotification({
                type: message.data.type || 'info',
                title: message.data.title,
                message: message.data.message,
                read: false,
              });
              break;
            default:
              break;
          }
        } catch (error) {
          console.error('메시지 파싱 오류:', error);
        }
      };
    } catch (error) {
      console.error('WebSocket 연결 생성 오류:', error);
      setConnectionStatus('error');
    }
  }, [
    url,
    protocols,
    binaryType,
    maxReconnectAttempts,
    reconnectInterval,
    actions,
    addToHistory,
    flushMessageQueue,
    setupHeartbeat,
  ]);

  // 수동 재연결
  const reconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (socketRef.current) {
      socketRef.current.close();
    }

    reconnectAttempts.current = 0;
    connect();
  }, [connect]);

  // 연결 해제
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect');
    }

    setSocket(null);
    setConnectionStatus('disconnected');
  }, []);

  // 초기 연결
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [url, connect, disconnect]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket,
    connectionStatus,
    lastMessage,
    sendMessage,
    sendJsonMessage,
    getMessageHistory,
    clearMessageHistory,
    reconnect,
    disconnect,
    subscribeTo,
  };
}

// 실시간 마켓 데이터 전용 훅
export function useRealTimeMarketData(symbols: string[]) {
  const { subscribeTo, sendMessage, connectionStatus } = useWebSocket({
    url: process.env.REACT_APP_WS_MARKET_URL || 'ws://localhost:8080/market',
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
      'ws://localhost:8080/notifications',
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
