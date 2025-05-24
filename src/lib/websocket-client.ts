import {
  type WebSocketConfig,
  type WebSocketState,
  type ServerMessage,
  type ClientMessage,
  type AuthMessage,
  type MessageHandler,
  type StateChangeHandler,
  type ErrorHandler,
} from '@/types/websocket';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private state: WebSocketState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isAuthenticated = false;

  // 이벤트 핸들러들
  private messageHandlers = new Map<string, Set<MessageHandler>>();
  private stateChangeHandlers = new Set<StateChangeHandler>();
  private errorHandlers = new Set<ErrorHandler>();

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      ...config,
    };
  }

  // 연결 시작
  connect(token?: string): void {
    if (this.state === 'connecting' || this.state === 'connected') {
      return;
    }

    this.setState('connecting');

    try {
      // WebSocket 연결 생성 (토큰은 핸드셰이크 후 별도 메시지로 전송)
      this.ws = new WebSocket(this.config.url);

      this.ws.onopen = () => {
        this.setState('connected');
        this.reconnectAttempts = 0;

        // 토큰이 있다면 인증 메시지 전송
        if (token) {
          this.authenticate(token);
        }

        this.startHeartbeat();
      };

      this.ws.onmessage = event => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          this.handleError(new Error('Invalid WebSocket message format'));
        }
      };

      this.ws.onclose = () => {
        this.setState('disconnected');
        this.isAuthenticated = false;
        this.stopHeartbeat();

        // 자동 재연결 시도
        if (this.reconnectAttempts < this.config.maxReconnectAttempts!) {
          this.scheduleReconnect(token);
        }
      };

      this.ws.onerror = () => {
        this.setState('error');
        this.handleError(new Error('WebSocket connection error'));
      };
    } catch (error) {
      this.setState('error');
      this.handleError(error as Error);
    }
  }

  // 연결 해제
  disconnect(): void {
    this.stopHeartbeat();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.setState('disconnected');
    this.isAuthenticated = false;
  }

  // 인증
  private authenticate(token: string): void {
    const authMessage: AuthMessage = {
      type: 'AUTH',
      payload: { token },
      timestamp: new Date().toISOString(),
    };

    this.sendMessage(authMessage);
  }

  // 메시지 전송
  private sendMessage(message: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // 메시지 처리
  private handleMessage(message: ServerMessage): void {
    // 인증 성공 체크
    if (message.type === 'AUTH_SUCCESS') {
      this.isAuthenticated = true;
    }

    // 등록된 핸들러들에게 메시지 전달
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in message handler:', error);
        }
      });
    }

    // 모든 메시지 핸들러에게도 전달
    const allHandlers = this.messageHandlers.get('*');
    if (allHandlers) {
      allHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('Error in global message handler:', error);
        }
      });
    }
  }

  // 에러 처리
  private handleError(error: Error): void {
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    });
  }

  // 상태 변경
  private setState(newState: WebSocketState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.stateChangeHandlers.forEach(handler => {
        try {
          handler(newState);
        } catch (error) {
          console.error('Error in state change handler:', error);
        }
      });
    }
  }

  // 재연결 스케줄링
  private scheduleReconnect(token?: string): void {
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect(token);
    }, this.config.reconnectInterval);
  }

  // 재연결 타이머 정리
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // 하트비트 시작
  private startHeartbeat(): void {
    this.stopHeartbeat();

    if (this.config.heartbeatInterval) {
      this.heartbeatTimer = setInterval(() => {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.sendMessage({
            type: 'PING',
            payload: {},
            timestamp: new Date().toISOString(),
          });
        }
      }, this.config.heartbeatInterval);
    }
  }

  // 하트비트 중지
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // 이벤트 핸들러 등록/해제 메서드들
  onMessage(type: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);

    // 해제 함수 반환
    return () => {
      const handlers = this.messageHandlers.get(type);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.messageHandlers.delete(type);
        }
      }
    };
  }

  onStateChange(handler: StateChangeHandler): () => void {
    this.stateChangeHandlers.add(handler);
    return () => this.stateChangeHandlers.delete(handler);
  }

  onError(handler: ErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  // 현재 상태 반환
  getState(): WebSocketState {
    return this.state;
  }

  // 인증 상태 반환
  isAuth(): boolean {
    return this.isAuthenticated;
  }

  // 연결 상태 반환
  isConnected(): boolean {
    return this.state === 'connected' && this.ws?.readyState === WebSocket.OPEN;
  }
}

// 싱글톤 인스턴스 생성
let wsClient: WebSocketClient | null = null;

export function createWebSocketClient(
  config: WebSocketConfig
): WebSocketClient {
  if (wsClient) {
    wsClient.disconnect();
  }

  wsClient = new WebSocketClient(config);
  return wsClient;
}

export function getWebSocketClient(): WebSocketClient | null {
  return wsClient;
}

export default WebSocketClient;
