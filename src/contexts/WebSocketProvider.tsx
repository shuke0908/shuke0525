import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../components/auth/AuthProvider'; // useAuthフックをインポート
import { toast } from 'sonner'; // sonnerからtoastをインポート

interface WebSocketContextType {
  isConnected: boolean;
  lastMessage: any; // WebSocketから受信した最新のメッセージ
  sendMessage: (_message: any) => void; // WebSocketメッセージを送信する関数
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

interface WebSocketProviderProps {
  children: ReactNode;
}

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
}) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const { user, isAuthenticated } = useAuth(); // AuthContextからユーザー情報を取得

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // 認証されていない場合は接続しない
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // WebSocketサーバーのURL (환경 변수 등으로 관리하는 것이 좋음)
    // 토큰을 쿼리 파라미터로 전달 (실제 환경에서는 더 안전한 방식 고려)
    // localStorage에서 토큰을 가져오는 로직이 필요합니다. 우선 임시로 'mock_token' 사용
    const token = localStorage.getItem('authToken'); // 예시: localStorage에서 토큰 가져오기
    if (!token) {
      console.warn(
        '[WebSocketProvider] Auth token not found, WebSocket connection not established.'
      );
      return; // 토큰이 없으면 연결 시도 안함
    }

    const wsUrl =
      process.env.REACT_APP_WS_URL || `ws://localhost:5000/ws?token=${token}`;
    const newSocket = new WebSocket(wsUrl);

    newSocket.onopen = () => {
      console.log('[WebSocketProvider] Connected to WebSocket server');
      setIsConnected(true);
      setSocket(newSocket);
      // 연결 성공 시 서버에 인증 메시지 전송 (선택 사항, 서버 구현에 따라 다름)
      // newSocket.send(JSON.stringify({ type: 'authenticate', payload: { token: 'your_jwt_token_here' } }));
    };

    newSocket.onmessage = _event => {
      try {
        const message = JSON.parse(_event.data as string);
        console.log('[WebSocketProvider] Message from server: ', message);
        setLastMessage(message);

        // 실시간 알림 처리
        if (message.type === 'new_notification' && message.payload) {
          const notification = message.payload;
          let toastFunction = toast.info; // 기본값

          // 알림 타입에 따라 toast 함수 결정 (선택 사항)
          switch (notification.type) {
            case 'deposit_approved':
            case 'withdrawal_approved':
            case 'kyc_approved':
            case 'trade_completed': // 성공적인 거래 완료
              toastFunction = toast.success;
              break;
            case 'deposit_rejected':
            case 'withdrawal_rejected':
            case 'kyc_rejected':
              toastFunction = toast.error;
              break;
            case 'new_message': // 새로운 채팅 메시지 등
              toastFunction = toast.message;
              break;
            default:
              toastFunction = toast.info;
          }

          toastFunction(notification.title, {
            description: notification.message,
            // action: notification.link ? { label: 'View', onClick: () => window.open(notification.link, '_blank') } : undefined,
          });
        }
        // 다른 메시지 타입 처리 (예: 잔액 업데이트 등)
        // if (message.type === 'balance_update') { ... }
      } catch (error) {
        console.error(
          '[WebSocketProvider] Error parsing message or handling notification:',
          error
        );
      }
    };

    newSocket.onclose = _event => {
      console.log(
        '[WebSocketProvider] Disconnected from WebSocket server',
        _event.reason
      );
      setIsConnected(false);
      setSocket(null);
      // 재연결 로직 (선택 사항)
    };

    newSocket.onerror = _error => {
      console.error('[WebSocketProvider] WebSocket error:', _error);
      setIsConnected(false);
      // 에러 발생 시 소켓을 null로 설정하여 재연결 시도 유도 (상황에 따라 다름)
      // setSocket(null);
    };

    return () => {
      if (
        newSocket.readyState === WebSocket.OPEN ||
        newSocket.readyState === WebSocket.CONNECTING
      ) {
        newSocket.close();
      }
      setSocket(null);
      setIsConnected(false);
    };
  }, [isAuthenticated, user, socket]);

  const sendMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.error('[WebSocketProvider] WebSocket is not connected.');
    }
  };

  return (
    <WebSocketContext.Provider
      value={{ isConnected, lastMessage, sendMessage }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};
