// 인증 관련 훅
export { useAuth } from './useAuth';
export { useFormValidation, commonValidationRules } from './useFormValidation';
export { useErrorHandler } from './useErrorHandler';

// 상태 관리 훅 (contexts에서 export)
export {
  useAppState,
  useUser,
  useUI,
  useAppConfig,
  useRealTimeData,
  useNotifications,
  useLoadingState,
  useModalState,
} from '../contexts/AppStateContext';

// 실시간 데이터 훅
export { useWebSocket } from './useWebSocket';

// 성능 관련 훅
export { useDebounce, useThrottle } from './usePerformance';

// UI 관련 훅
export { useToast } from './use-toast';
export { useTheme } from '../lib/ThemeProvider';
export { useIsMobile } from './use-mobile';

// API 관련 훅
export { 
  useLogin,
  useLogout,
  useUpdateProfile,
  useUserProfile,
  useUserBalance,
  useUserTransactions,
  useFlashTradeSettings,
  useActiveFlashTrades,
  useFlashTradeHistory,
  useActiveQuickTrades,
  useCreateFlashTrade,
  useCreateQuickTrade,
  useCloseQuickTrade,
  useAdminDashboard,
  useAdminUsers,
  useAdminSettings,
  useAdminAction,
  useInvalidateQueries,
  queryKeys
} from './use-api';

// Form 관련 훅
export { useForm } from './use-form';
