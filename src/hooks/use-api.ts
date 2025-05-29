import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import type {
  UseQueryOptions,
  UseMutationOptions,
} from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import {
  authApi,
  userApi,
  tradeApi,
  adminApi,
  walletApi,
  supportApi,
} from '@/lib/api-client';

// Query Keys
export const queryKeys = {
  // User related
  userProfile: ['user', 'profile'] as const,
  userBalance: ['user', 'balance'] as const,
  userTransactions: (params?: any) => ['user', 'transactions', params] as const,

  // Flash Trade related
  flashTradeSettings: ['flashTrade', 'settings'] as const,
  activeFlashTrades: ['flashTrade', 'active'] as const,
  flashTradeHistory: (params?: any) =>
    ['flashTrade', 'history', params] as const,

  // Quick Trade related
  activeQuickTrades: ['quickTrade', 'active'] as const,

  // Admin related
  adminDashboard: ['admin', 'dashboard'] as const,
  adminUsers: (params?: any) => ['admin', 'users', params] as const,
  adminSettings: ['admin', 'settings'] as const,
  adminKyc: (params?: any) => ['admin', 'kyc', params] as const,
  adminDeposits: (params?: any) => ['admin', 'deposits', params] as const,
  adminWithdrawals: (params?: any) => ['admin', 'withdrawals', params] as const,
  adminFlashTrades: (params?: any) => ['admin', 'flashTrades', params] as const,
  adminSupportTickets: (params?: any) =>
    ['admin', 'supportTickets', params] as const,
} as const;

// User Profile Hook
export function useUserProfile(options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.userProfile,
    queryFn: () => userApi.getProfile(),
    staleTime: 5 * 60 * 1000, // 5분
    ...options,
  });
}

// User Balance Hook
export function useUserBalance(options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.userBalance,
    queryFn: () => userApi.getBalance(),
    staleTime: 30 * 1000, // 30초
    refetchInterval: 60 * 1000, // 1분마다 자동 갱신
    ...options,
  });
}

// User Transactions Hook
export function useUserTransactions(params?: any, options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.userTransactions(params),
    queryFn: () => userApi.getTransactions(params),
    staleTime: 2 * 60 * 1000, // 2분
    ...options,
  });
}

// Flash Trade Settings Hook
export function useFlashTradeSettings(options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.flashTradeSettings,
    queryFn: () => tradeApi.getFlashTradeSettings(),
    staleTime: 10 * 60 * 1000, // 10분
    ...options,
  });
}

// Active Flash Trades Hook
export function useActiveFlashTrades(options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.activeFlashTrades,
    queryFn: () => tradeApi.getActiveFlashTrades(),
    staleTime: 10 * 1000, // 10초
    refetchInterval: 5 * 1000, // 5초마다 자동 갱신
    ...options,
  });
}

// Flash Trade History Hook
export function useFlashTradeHistory(params?: any, options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.flashTradeHistory(params),
    queryFn: () => tradeApi.getFlashTradeHistory(params),
    staleTime: 60 * 1000, // 1분
    ...options,
  });
}

// Active Quick Trades Hook
export function useActiveQuickTrades(options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.activeQuickTrades,
    queryFn: () => tradeApi.getActiveQuickTrades(),
    staleTime: 10 * 1000, // 10초
    refetchInterval: 5 * 1000, // 5초마다 자동 갱신
    ...options,
  });
}

// Admin Dashboard Hook
export function useAdminDashboard(options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.adminDashboard,
    queryFn: () => adminApi.getDashboardStats(),
    staleTime: 2 * 60 * 1000, // 2분
    ...options,
  });
}

// Admin Users Hook
export function useAdminUsers(params?: any, options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.adminUsers(params),
    queryFn: () => adminApi.getUsers(params),
    staleTime: 60 * 1000, // 1분
    ...options,
  });
}

// Admin Settings Hook
export function useAdminSettings(options?: UseQueryOptions) {
  return useQuery({
    queryKey: queryKeys.adminSettings,
    queryFn: () => adminApi.getSystemSettings(),
    staleTime: 10 * 60 * 1000, // 10분
    ...options,
  });
}

// Mutation Hooks
export function useLogin(options?: UseMutationOptions<any, any, any>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: {
      email: string;
      password: string;
      rememberMe?: boolean;
      captchaToken?: string;
    }) => authApi.login(credentials),
    onSuccess: () => {
      // 로그인 성공 시 사용자 관련 데이터 새로고침
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile });
      queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });
      toast({
        title: '로그인 성공',
        description: '환영합니다!',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: '로그인 실패',
        description: error.message || '로그인에 실패했습니다.',
        variant: 'destructive',
      });
    },
    ...options,
  });
}

export function useLogout(options?: UseMutationOptions<any, any, any>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: () => {
      // 로그아웃 시 모든 캐시 데이터 제거
      queryClient.clear();
      toast({
        title: '로그아웃',
        description: '성공적으로 로그아웃되었습니다.',
        variant: 'default',
      });
    },
    ...options,
  });
}

export function useUpdateProfile(options?: UseMutationOptions<any, any, any>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfile });
      toast({
        title: '프로필 업데이트',
        description: '프로필이 성공적으로 업데이트되었습니다.',
        variant: 'default',
      });
    },
    ...options,
  });
}

export function useCreateFlashTrade(
  options?: UseMutationOptions<any, any, any>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => tradeApi.createFlashTrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activeFlashTrades });
      queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });
      toast({
        title: 'Flash Trade 생성',
        description: '거래가 성공적으로 생성되었습니다.',
        variant: 'default',
      });
    },
    ...options,
  });
}

export function useCreateQuickTrade(
  options?: UseMutationOptions<any, any, any>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => tradeApi.createQuickTrade(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activeQuickTrades });
      queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });
      toast({
        title: 'Quick Trade 생성',
        description: '거래가 성공적으로 생성되었습니다.',
        variant: 'default',
      });
    },
    ...options,
  });
}

export function useCloseQuickTrade(
  options?: UseMutationOptions<any, any, any>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (tradeId: number) => tradeApi.closeQuickTrade(tradeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activeQuickTrades });
      queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });
      toast({
        title: '거래 종료',
        description: '거래가 성공적으로 종료되었습니다.',
        variant: 'default',
      });
    },
    ...options,
  });
}

// Admin Mutation Hooks
export function useAdminAction(
  options?: UseMutationOptions<any, any, AdminAction>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (action: AdminAction) => adminApi.executeAction(action),
    onSuccess: (_data, variables) => {
      // 액션 타입에 따라 적절한 쿼리 무효화
      switch (variables.action) {
        case 'adjust_user_balance':
          queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });
          queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers() });
          break;
        case 'set_flash_trade_result':
          queryClient.invalidateQueries({
            queryKey: queryKeys.activeFlashTrades,
          });
          queryClient.invalidateQueries({
            queryKey: queryKeys.flashTradeHistory(),
          });
          break;
        case 'approve_deposit':
        case 'reject_deposit':
          queryClient.invalidateQueries({
            queryKey: queryKeys.adminDeposits(),
          });
          queryClient.invalidateQueries({ queryKey: queryKeys.userBalance });
          break;
        case 'approve_withdrawal':
        case 'reject_withdrawal':
          queryClient.invalidateQueries({
            queryKey: queryKeys.adminWithdrawals(),
          });
          break;
        case 'approve_kyc':
        case 'reject_kyc':
          queryClient.invalidateQueries({ queryKey: queryKeys.adminKyc() });
          break;
        case 'update_system_settings':
          queryClient.invalidateQueries({ queryKey: queryKeys.adminSettings });
          break;
        default:
          // 알 수 없는 액션의 경우 관련 쿼리들을 무효화
          queryClient.invalidateQueries({ queryKey: ['admin'] });
          break;
      }

      toast({
        title: '작업 완료',
        description: '관리자 작업이 성공적으로 완료되었습니다.',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: '작업 실패',
        description: error.message || '작업 처리 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
    ...options,
  });
}

// Helper function to invalidate all related queries
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateUserData: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    invalidateTradeData: () => {
      queryClient.invalidateQueries({ queryKey: ['flashTrade'] });
      queryClient.invalidateQueries({ queryKey: ['quickTrade'] });
    },
    invalidateAdminData: () => {
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
  };
}
