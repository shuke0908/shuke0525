/**
 * 통합 컨텍스트 인덱스
 * 모든 컨텍스트를 한 곳에서 export
 */

// WebSocket 관련
export { WebSocketProvider, useWebSocket } from './WebSocketContext';
// WebSocketContext에서 실제로 export되는 타입들만 import

// 전역 앱 상태 관리
export {
  AppStateProvider,
  useAppState,
  useUser,
  useUI,
  useAppConfig,
  useRealTimeData,
  useNotifications,
  useLoadingState,
  useModalState,
} from './AppStateContext';
export type {
  AppState,
  AppAction,
  UserPreferences,
  Notification,
  AppConfig,
} from './AppStateContext';

// 통합 export
export const Contexts = {
  // WebSocket과 AppState Provider들은 각각 직접 import해서 사용
};

// Provider들을 조합한 최상위 Provider
export { default as CombinedProvider } from './CombinedProvider';
