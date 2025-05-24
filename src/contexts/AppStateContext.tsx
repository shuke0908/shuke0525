import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
} from 'react';
import type { ReactNode } from 'react';
import type { User } from '@/types';

// NotificationSettings 타입을 직접 정의
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  browser: boolean;
  trading: boolean;
  security: boolean;
}

// 전역 상태 타입 정의
export interface AppState {
  // 사용자 상태
  user: {
    data: User | null;
    isAuthenticated: boolean;
    preferences: UserPreferences;
    permissions: string[];
  };

  // UI 상태
  ui: {
    theme: 'light' | 'dark' | 'system';
    sidebarCollapsed: boolean;
    notifications: Notification[];
    loading: {
      global: boolean;
      operations: Record<string, boolean>;
    };
    modals: {
      [key: string]: boolean;
    };
  };

  // 애플리케이션 상태
  app: {
    isOnline: boolean;
    maintenanceMode: boolean;
    version: string;
    config: AppConfig;
  };

  // 실시간 데이터
  realTime: {
    marketData: Record<string, any>;
    notifications: any[];
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  };
}

export interface UserPreferences {
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  trading: {
    defaultAmount: number;
    autoRefresh: boolean;
    soundEnabled: boolean;
  };
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

export interface AppConfig {
  features: {
    flashTrading: boolean;
    quickTrading: boolean;
    advancedCharts: boolean;
    notifications: boolean;
  };
  limits: {
    maxTransactionAmount: number;
    dailyTransactionLimit: number;
    minBalance: number;
  };
  maintenance: {
    scheduled: boolean;
    message?: string;
  };
}

// 액션 타입
export type AppAction =
  // 사용자 액션
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'UPDATE_USER_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'SET_USER_PERMISSIONS'; payload: string[] }

  // UI 액션
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'system' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_SIDEBAR_COLLAPSED'; payload: boolean }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'CLEAR_ALL_NOTIFICATIONS' }
  | { type: 'SET_GLOBAL_LOADING'; payload: boolean }
  | {
      type: 'SET_OPERATION_LOADING';
      payload: { operation: string; loading: boolean };
    }
  | { type: 'TOGGLE_MODAL'; payload: { modal: string; open: boolean } }

  // 앱 상태 액션
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_MAINTENANCE_MODE'; payload: boolean }
  | { type: 'UPDATE_APP_CONFIG'; payload: Partial<AppConfig> }

  // 실시간 데이터 액션
  | { type: 'UPDATE_MARKET_DATA'; payload: { symbol: string; data: any } }
  | { type: 'ADD_REALTIME_NOTIFICATION'; payload: any }
  | {
      type: 'SET_CONNECTION_STATUS';
      payload: 'connected' | 'disconnected' | 'reconnecting';
    };

// 초기 상태
const initialState: AppState = {
  user: {
    data: null,
    isAuthenticated: false,
    preferences: {
      language: 'ko',
      timezone: 'Asia/Seoul',
      notifications: {
        email: true,
        push: true,
        browser: true,
        trading: true,
        security: true,
      },
      trading: {
        defaultAmount: 100,
        autoRefresh: true,
        soundEnabled: true,
      },
    },
    permissions: [],
  },

  ui: {
    theme: 'system',
    sidebarCollapsed: false,
    notifications: [],
    loading: {
      global: false,
      operations: {},
    },
    modals: {},
  },

  app: {
    isOnline: navigator.onLine,
    maintenanceMode: false,
    version: process.env.REACT_APP_VERSION || '1.0.0',
    config: {
      features: {
        flashTrading: true,
        quickTrading: true,
        advancedCharts: true,
        notifications: true,
      },
      limits: {
        maxTransactionAmount: 10000,
        dailyTransactionLimit: 50000,
        minBalance: 0,
      },
      maintenance: {
        scheduled: false,
      },
    },
  },

  realTime: {
    marketData: {},
    notifications: [],
    connectionStatus: 'disconnected',
  },
};

// 리듀서
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // 사용자 액션
    case 'SET_USER':
      return {
        ...state,
        user: {
          ...state.user,
          data: action.payload,
        },
      };

    case 'SET_AUTHENTICATED':
      return {
        ...state,
        user: {
          ...state.user,
          isAuthenticated: action.payload,
        },
      };

    case 'UPDATE_USER_PREFERENCES':
      return {
        ...state,
        user: {
          ...state.user,
          preferences: {
            ...state.user.preferences,
            ...action.payload,
          },
        },
      };

    case 'SET_USER_PERMISSIONS':
      return {
        ...state,
        user: {
          ...state.user,
          permissions: action.payload,
        },
      };

    // UI 액션
    case 'SET_THEME':
      return {
        ...state,
        ui: {
          ...state.ui,
          theme: action.payload,
        },
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarCollapsed: !state.ui.sidebarCollapsed,
        },
      };

    case 'SET_SIDEBAR_COLLAPSED':
      return {
        ...state,
        ui: {
          ...state.ui,
          sidebarCollapsed: action.payload,
        },
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [action.payload, ...state.ui.notifications],
        },
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.filter(
            n => n.id !== action.payload
          ),
        },
      };

    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: state.ui.notifications.map(n =>
            n.id === action.payload ? { ...n, read: true } : n
          ),
        },
      };

    case 'CLEAR_ALL_NOTIFICATIONS':
      return {
        ...state,
        ui: {
          ...state.ui,
          notifications: [],
        },
      };

    case 'SET_GLOBAL_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: {
            ...state.ui.loading,
            global: action.payload,
          },
        },
      };

    case 'SET_OPERATION_LOADING':
      return {
        ...state,
        ui: {
          ...state.ui,
          loading: {
            ...state.ui.loading,
            operations: {
              ...state.ui.loading.operations,
              [action.payload.operation]: action.payload.loading,
            },
          },
        },
      };

    case 'TOGGLE_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          modals: {
            ...state.ui.modals,
            [action.payload.modal]: action.payload.open,
          },
        },
      };

    // 앱 상태 액션
    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        app: {
          ...state.app,
          isOnline: action.payload,
        },
      };

    case 'SET_MAINTENANCE_MODE':
      return {
        ...state,
        app: {
          ...state.app,
          maintenanceMode: action.payload,
        },
      };

    case 'UPDATE_APP_CONFIG':
      return {
        ...state,
        app: {
          ...state.app,
          config: {
            ...state.app.config,
            ...action.payload,
          },
        },
      };

    // 실시간 데이터 액션
    case 'UPDATE_MARKET_DATA':
      return {
        ...state,
        realTime: {
          ...state.realTime,
          marketData: {
            ...state.realTime.marketData,
            [action.payload.symbol]: action.payload.data,
          },
        },
      };

    case 'ADD_REALTIME_NOTIFICATION':
      return {
        ...state,
        realTime: {
          ...state.realTime,
          notifications: [action.payload, ...state.realTime.notifications],
        },
      };

    case 'SET_CONNECTION_STATUS':
      return {
        ...state,
        realTime: {
          ...state.realTime,
          connectionStatus: action.payload,
        },
      };

    default:
      return state;
  }
}

// 컨텍스트 생성
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;

  // 편의 메서드들
  actions: {
    // 사용자 관련
    setUser: (_user: User | null) => void;
    setAuthenticated: (_authenticated: boolean) => void;
    updateUserPreferences: (_preferences: Partial<UserPreferences>) => void;

    // UI 관련
    setTheme: (_theme: 'light' | 'dark' | 'system') => void;
    toggleSidebar: () => void;
    addNotification: (
      _notification: Omit<Notification, 'id' | 'timestamp'>
    ) => void;
    removeNotification: (_id: string) => void;
    setLoading: (_operation: string, _loading: boolean) => void;
    toggleModal: (_modal: string, _open?: boolean) => void;

    // 실시간 데이터 관련
    updateMarketData: (_symbol: string, _data: any) => void;
    setConnectionStatus: (
      _status: 'connected' | 'disconnected' | 'reconnecting'
    ) => void;
  };
}

const AppStateContext = createContext<AppContextType | undefined>(undefined);

// 프로바이더 컴포넌트
interface AppStateProviderProps {
  children: ReactNode;
}

export function AppStateProvider({ children }: AppStateProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 편의 액션 메서드들
  const actions = {
    setUser: (_user: User | null) =>
      dispatch({ type: 'SET_USER', payload: _user }),
    setAuthenticated: (_authenticated: boolean) =>
      dispatch({ type: 'SET_AUTHENTICATED', payload: _authenticated }),
    updateUserPreferences: (_preferences: Partial<UserPreferences>) =>
      dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: _preferences }),

    setTheme: (_theme: 'light' | 'dark' | 'system') =>
      dispatch({ type: 'SET_THEME', payload: _theme }),
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    addNotification: (_notification: Omit<Notification, 'id' | 'timestamp'>) => {
      const fullNotification: Notification = {
        ..._notification,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        read: false,
      };
      dispatch({ type: 'ADD_NOTIFICATION', payload: fullNotification });
    },
    removeNotification: (_id: string) =>
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: _id }),
    setLoading: (_operation: string, _loading: boolean) =>
      dispatch({
        type: 'SET_OPERATION_LOADING',
        payload: { operation: _operation, loading: _loading },
      }),
    toggleModal: (_modal: string, _open?: boolean) =>
      dispatch({
        type: 'TOGGLE_MODAL',
        payload: { modal: _modal, open: _open ?? !state.ui.modals[_modal] },
      }),

    updateMarketData: (_symbol: string, _data: any) =>
      dispatch({ type: 'UPDATE_MARKET_DATA', payload: { symbol: _symbol, data: _data } }),
    setConnectionStatus: (
      _status: 'connected' | 'disconnected' | 'reconnecting'
    ) => dispatch({ type: 'SET_CONNECTION_STATUS', payload: _status }),
  };

  // 온라인 상태 감지
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () =>
      dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
    const handleOffline = () =>
      dispatch({ type: 'SET_ONLINE_STATUS', payload: false });

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // 로컬 스토리지 동기화
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'UPDATE_USER_PREFERENCES', payload: preferences });
      } catch (error) {
        console.error('Error loading user preferences:', error);
      }
    }
  }, []);

  // 설정 변경 시 로컬 스토리지 저장
  useEffect(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(
      'userPreferences',
      JSON.stringify(state.user.preferences)
    );
  }, [state.user.preferences]);

  // 테마 적용
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    const theme = state.ui.theme;

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const applySystemTheme = () => {
        root.classList.toggle('dark', mediaQuery.matches);
      };

      applySystemTheme();
      mediaQuery.addEventListener('change', applySystemTheme);

      return () => mediaQuery.removeEventListener('change', applySystemTheme);
    } else {
      root.classList.toggle('dark', theme === 'dark');
      return undefined;
    }
  }, [state.ui.theme]);

  const contextValue: AppContextType = {
    state,
    dispatch,
    actions,
  };

  return (
    <AppStateContext.Provider value={contextValue}>
      {children}
    </AppStateContext.Provider>
  );
}

// 커스텀 훅
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}

// 선택적 상태 접근 훅들
export function useUser() {
  const { state } = useAppState();
  return state.user;
}

export function useUI() {
  const { state } = useAppState();
  return state.ui;
}

export function useAppConfig() {
  const { state } = useAppState();
  return state.app;
}

export function useRealTimeData() {
  const { state } = useAppState();
  return state.realTime;
}

export function useNotifications() {
  const { state, actions } = useAppState();
  return {
    notifications: state.ui.notifications,
    addNotification: actions.addNotification,
    removeNotification: actions.removeNotification,
    unreadCount: state.ui.notifications.filter(n => !n.read).length,
  };
}

export function useLoadingState() {
  const { state, actions } = useAppState();
  return {
    isLoading: (operation?: string) =>
      operation
        ? state.ui.loading.operations[operation] || false
        : state.ui.loading.global,
    setLoading: actions.setLoading,
    globalLoading: state.ui.loading.global,
  };
}

export function useModalState() {
  const { state, actions } = useAppState();
  return {
    isOpen: (modal: string) => state.ui.modals[modal] || false,
    toggle: actions.toggleModal,
  };
}
