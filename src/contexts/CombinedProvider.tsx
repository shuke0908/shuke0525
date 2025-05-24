/**
 * 통합 Provider
 * 모든 컨텍스트 Provider들을 올바른 순서로 조합
 */

import React from 'react';
import type { ReactNode } from 'react';
import { AppStateProvider } from './AppStateContext';
import { WebSocketProvider } from './WebSocketContext';

interface CombinedProviderProps {
  children: ReactNode;
}

/**
 * 모든 컨텍스트 Provider들을 조합한 최상위 Provider
 *
 * Provider 순서:
 * 1. AppStateProvider - 전역 상태 관리 (가장 상위)
 * 2. WebSocketProvider - WebSocket 연결 관리
 * 3. children - 실제 애플리케이션 컴포넌트들
 */
function CombinedProvider({ children }: CombinedProviderProps) {
  return (
    <AppStateProvider>
      <WebSocketProvider>{children}</WebSocketProvider>
    </AppStateProvider>
  );
}

export default CombinedProvider;
