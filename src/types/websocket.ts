// WebSocket 메시지 기본 구조
export interface WebSocketMessage<T = any> {
  type: string;
  payload: T;
  timestamp: string;
}

// 클라이언트에서 서버로 보내는 메시지 타입
export interface ClientMessage extends WebSocketMessage {
  type: 'AUTH' | 'SUBSCRIBE' | 'UNSUBSCRIBE' | 'PING';
}

// 인증 메시지
export interface AuthMessage extends ClientMessage {
  type: 'AUTH';
  payload: {
    token: string;
  };
}

// 서버에서 클라이언트로 보내는 메시지 타입들
export type ServerMessageType =
  | 'AUTH_SUCCESS'
  | 'BALANCE_UPDATED'
  | 'FLASH_TRADE_CREATED'
  | 'FLASH_TRADE_COMPLETED'
  | 'QUICK_TRADE_UPDATED'
  | 'DEPOSIT_STATUS_CHANGED'
  | 'WITHDRAWAL_STATUS_CHANGED'
  | 'KYC_STATUS_CHANGED'
  | 'NOTIFICATION'
  | 'ERROR'
  | 'PONG';

// 인증 성공 메시지
export interface AuthSuccessMessage extends WebSocketMessage {
  type: 'AUTH_SUCCESS';
  payload: {
    userId: number;
    message?: string;
  };
}

// 잔액 업데이트 알림
export interface BalanceUpdatedMessage extends WebSocketMessage {
  type: 'BALANCE_UPDATED';
  payload: {
    newBalance: number;
    changeAmount: number;
    reason: string;
    transactionId?: string;
  };
}

// Flash Trade 생성 알림
export interface FlashTradeCreatedMessage extends WebSocketMessage {
  type: 'FLASH_TRADE_CREATED';
  payload: {
    tradeId: number;
    amount: number;
    direction: 'up' | 'down';
    duration: number;
    startTime: string;
    endTime: string;
  };
}

// Flash Trade 완료 알림
export interface FlashTradeCompletedMessage extends WebSocketMessage {
  type: 'FLASH_TRADE_COMPLETED';
  payload: {
    tradeId: number;
    result: 'win' | 'lose';
    profit: number;
    finalPrice?: number;
    initialPrice?: number;
  };
}

// Quick Trade 업데이트 알림
export interface QuickTradeUpdatedMessage extends WebSocketMessage {
  type: 'QUICK_TRADE_UPDATED';
  payload: {
    tradeId: number;
    status: 'active' | 'closed';
    currentPrice?: number;
    pnl?: number;
    closedAt?: string;
  };
}

// 입금 상태 변경 알림
export interface DepositStatusChangedMessage extends WebSocketMessage {
  type: 'DEPOSIT_STATUS_CHANGED';
  payload: {
    depositId: number;
    status: 'pending' | 'approved' | 'rejected';
    amount: number;
    reason?: string;
  };
}

// 출금 상태 변경 알림
export interface WithdrawalStatusChangedMessage extends WebSocketMessage {
  type: 'WITHDRAWAL_STATUS_CHANGED';
  payload: {
    withdrawalId: number;
    status: 'pending' | 'approved' | 'rejected';
    amount: number;
    reason?: string;
  };
}

// KYC 상태 변경 알림
export interface KycStatusChangedMessage extends WebSocketMessage {
  type: 'KYC_STATUS_CHANGED';
  payload: {
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
    requiredDocuments?: string[];
  };
}

// 일반 알림
export interface NotificationMessage extends WebSocketMessage {
  type: 'NOTIFICATION';
  payload: {
    title: string;
    message: string;
    level: 'info' | 'success' | 'warning' | 'error';
    actionUrl?: string;
    actionText?: string;
  };
}

// 에러 메시지
export interface ErrorMessage extends WebSocketMessage {
  type: 'ERROR';
  payload: {
    code: string;
    message: string;
    details?: any;
  };
}

// Pong 메시지
export interface PongMessage extends WebSocketMessage {
  type: 'PONG';
  payload: {
    timestamp: string;
  };
}

// 서버 메시지 유니온 타입
export type ServerMessage =
  | AuthSuccessMessage
  | BalanceUpdatedMessage
  | FlashTradeCreatedMessage
  | FlashTradeCompletedMessage
  | QuickTradeUpdatedMessage
  | DepositStatusChangedMessage
  | WithdrawalStatusChangedMessage
  | KycStatusChangedMessage
  | NotificationMessage
  | ErrorMessage
  | PongMessage;

// WebSocket 연결 상태
export type WebSocketState =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

// WebSocket 클라이언트 설정
export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
}

// WebSocket 이벤트 핸들러 타입
export type MessageHandler<T = any> = (_message: WebSocketMessage<T>) => void;
export type StateChangeHandler = (_state: WebSocketState) => void;
export type ErrorHandler = (_error: Error) => void;
