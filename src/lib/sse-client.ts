export interface SSEConfig {
  url: string;
  token: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface SSEMessage {
  type: string;
  data?: any;
  timestamp: string;
}

export type SSEMessageHandler = (message: SSEMessage) => void;
export type SSEStateChangeHandler = (state: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
export type SSEErrorHandler = (error: Error) => void;

export class SSEClient {
  private eventSource: EventSource | null = null;
  private config: SSEConfig;
  private state: 'connecting' | 'connected' | 'disconnected' | 'error' = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;

  // 이벤트 핸들러들
  private messageHandlers = new Map<string, Set<SSEMessageHandler>>();
  private stateChangeHandlers = new Set<SSEStateChangeHandler>();
  private errorHandlers = new Set<SSEErrorHandler>();

  constructor(config: SSEConfig) {
    this.config = {
      reconnectInterval: 5000,
      maxReconnectAttempts: 10,
      ...config,
    };
  }

  // 연결 시작
  connect(): void {
    if (this.state === 'connecting' || this.state === 'connected') {
      return;
    }

    this.setState('connecting');

    try {
      // SSE URL에 토큰 추가
      const url = new URL(this.config.url);
      url.searchParams.set('token', this.config.token);

      this.eventSource = new EventSource(url.toString());

      this.eventSource.onopen = () => {
        this.setState('connected');
        this.reconnectAttempts = 0;
        console.log('✅ SSE 연결 성공');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const message: SSEMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('SSE 메시지 파싱 오류:', error);
          this.handleError(new Error('Invalid SSE message format'));
        }
      };

      this.eventSource.onerror = () => {
        this.setState('error');
        this.handleError(new Error('SSE connection error'));

        // 자동 재연결 시도
        if (this.reconnectAttempts < this.config.maxReconnectAttempts!) {
          this.scheduleReconnect();
        }
      };

    } catch (error) {
      this.setState('error');
      this.handleError(error as Error);
    }
  }

  // 연결 해제
  disconnect(): void {
    this.clearReconnectTimer();

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    this.setState('disconnected');
    console.log('🔌 SSE 연결 해제');
  }

  // 메시지 처리
  private handleMessage(message: SSEMessage): void {
    console.log('📨 SSE 메시지 수신:', message);

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
    console.error('SSE 오류:', error);
    this.errorHandlers.forEach(handler => {
      try {
        handler(error);
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    });
  }

  // 상태 변경
  private setState(newState: 'connecting' | 'connected' | 'disconnected' | 'error'): void {
    if (this.state !== newState) {
      const oldState = this.state;
      this.state = newState;
      console.log(`🔄 SSE 상태 변경: ${oldState} → ${newState}`);
      
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
  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`🔄 SSE 재연결 시도 ${this.reconnectAttempts}/${this.config.maxReconnectAttempts}`);
      this.connect();
    }, this.config.reconnectInterval);
  }

  // 재연결 타이머 정리
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  // 메시지 핸들러 등록
  onMessage(type: string, handler: SSEMessageHandler): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    
    this.messageHandlers.get(type)!.add(handler);

    // 핸들러 제거 함수 반환
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

  // 상태 변경 핸들러 등록
  onStateChange(handler: SSEStateChangeHandler): () => void {
    this.stateChangeHandlers.add(handler);
    return () => this.stateChangeHandlers.delete(handler);
  }

  // 에러 핸들러 등록
  onError(handler: SSEErrorHandler): () => void {
    this.errorHandlers.add(handler);
    return () => this.errorHandlers.delete(handler);
  }

  // 현재 상태 반환
  getState(): 'connecting' | 'connected' | 'disconnected' | 'error' {
    return this.state;
  }

  // 연결 상태 확인
  isConnected(): boolean {
    return this.state === 'connected';
  }
}

// 전역 SSE 클라이언트 인스턴스
let globalSSEClient: SSEClient | null = null;

export function createSSEClient(config: SSEConfig): SSEClient {
  globalSSEClient = new SSEClient(config);
  return globalSSEClient;
}

export function getSSEClient(): SSEClient | null {
  return globalSSEClient;
} 