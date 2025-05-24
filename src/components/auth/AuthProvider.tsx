import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import type { ReactNode } from 'react';
import {
  useQuery,
  useMutation,
  type UseMutationResult,
} from '@tanstack/react-query';
import { queryClient } from '../../lib/query-client';
import { apiClient } from '../../lib/query-client';
import { useToast } from '../../hooks/use-toast';
import { AUTH_ROUTES, USER_ROUTES } from '../../constants/api-routes';
import type { RegisterData } from '@/types';

// User data that might be returned from login along with a token
interface LoginResponse {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: 'user' | 'admin' | 'superadmin';
  profileImage?: string | null | undefined;
  balance?: string | undefined;
  authToken: string; // For WebSocket authentication
  twoFactorRequired?: boolean | undefined;
  rememberMe?: boolean | undefined;
}

// User data fetched from /api/user (might not include authToken)
type UserProfile = {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  role: 'user' | 'admin' | 'superadmin';
  profileImage: string | null;
  balance: string;
  // createdAt and updatedAt are not typically needed in AuthContext user object directly
};

type AuthContextType = {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<LoginResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<LoginResponse, Error, RegisterData>;
  getAuthToken: () => string | null;
  twoFactorRequired: boolean;
  setTwoFactorRequired: React.Dispatch<React.SetStateAction<boolean>>;
};

type LoginData = {
  email: string;
  password: string;
  captchaToken?: string;
  rememberMe?: boolean;
};

export const AuthContext = createContext<AuthContextType | null>(null);

// 쿠키에서 인증 토큰 가져오기
function getAuthTokenFromCookie(): string | null {
  if (typeof document !== 'undefined') {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='))
      ?.split('=')[1];
    return cookieValue || null;
  }
  return null;
}

// 쿠키에 인증 토큰 설정
function setAuthTokenCookie(token: string, persistent: boolean = false) {
  if (typeof document !== 'undefined') {
    const maxAge = persistent ? 30 * 24 * 60 * 60 : 24 * 60 * 60; // 30일 또는 1일
    const secure = window.location.protocol === 'https:';
    document.cookie = `auth_token=${token}; max-age=${maxAge}; path=/; ${secure ? 'secure;' : ''} samesite=lax`;
  }
}

// 쿠키에서 인증 토큰 제거
function removeAuthTokenCookie() {
  if (typeof document !== 'undefined') {
    document.cookie =
      'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [authToken, setAuthToken] = useState<string | null>(() => {
    // SSR에서는 null 반환
    if (typeof window === 'undefined') return null;
    return getAuthTokenFromCookie();
  });
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // 클라이언트 사이드 hydration 확인
  useEffect(() => {
    setIsClient(true);
    const token = getAuthTokenFromCookie();
    if (token !== authToken) {
      setAuthToken(token);
    }
  }, [authToken]);

  const {
    data: user,
    error,
    isLoading: isLoadingUser,
  } = useQuery<UserProfile | null, Error>({
    queryKey: [USER_ROUTES.PROFILE],
    queryFn: async () => {
      try {
        const userData = await apiClient.get<UserProfile>(USER_ROUTES.PROFILE);
        return userData;
      } catch (fetchError: any) {
        console.error('Error fetching user profile:', fetchError);
        if (fetchError.status === 401) {
          setAuthToken(null);
          removeAuthTokenCookie();
        }
        // Return null instead of throwing to let useQuery handle the error state
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !!authToken && isClient, // 클라이언트에서만 실행
    retry: false,
  });

  const loginMutation = useMutation<LoginResponse, Error, LoginData>({
    mutationFn: async (credentials: LoginData) => {
      try {
        // API 경로 상수 사용하여 일관된 경로 호출
        const data = await apiClient.post<any>(AUTH_ROUTES.LOGIN, {
          email: credentials.email,
          password: credentials.password,
          captchaToken: credentials.captchaToken
        });
        
        // 현재 API 응답 구조: { message: string, user: {...} }
        if (!data.user) {
          throw new Error(data.message || 'Login failed');
        }
        
        // AuthProvider가 기대하는 형식으로 변환
        return {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          role: data.user.role,
          profileImage: data.user.profileImage || null,
          balance: data.user.balance || '0',
          authToken: data.user.authToken || 'temp-token', // 임시 토큰
          twoFactorRequired: data.twoFactorRequired || false,
          rememberMe: credentials.rememberMe || false,
        } as LoginResponse;
      } catch (error: any) {
        console.error('Login error:', error);
        throw new Error(error.message || 'Login failed');
      }
    },
    onSuccess: (data: LoginResponse) => {
      if (data.twoFactorRequired) {
        toast({
          title: '2FA Required',
          description: 'Please enter your 2FA code to complete login.',
        });
      } else {
        // 임시 토큰 설정 (실제 JWT 토큰이 구현되면 교체)
        setAuthToken(data.authToken);
        setAuthTokenCookie(data.authToken, data.rememberMe || false);

        const userProfile: UserProfile = {
          id: data.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
          profileImage: data.profileImage || null,
          balance: data.balance || '0',
        };
        queryClient.setQueryData([USER_ROUTES.PROFILE], userProfile);
        
        if (data.twoFactorRequired) {
          setTwoFactorRequired(true);
        }
        toast({
          title: '로그인 성공',
          description: '환영합니다!',
        });
        
        // 로그인 성공 후 대시보드로 리디렉션
        window.location.href = '/dashboard';
      }
    },
    onError: (error: Error) => {
      setAuthToken(null);
      removeAuthTokenCookie();
      toast({
        title: '로그인 실패',
        description:
          error.message || '이메일 또는 비밀번호가 올바르지 않습니다.',
        variant: 'destructive',
      });
    },
  });

  const registerMutation = useMutation<LoginResponse, Error, RegisterData>({
    mutationFn: async (credentials: RegisterData) => {
      try {
        const response = await apiClient.post<any>(AUTH_ROUTES.REGISTER, credentials);
        
        // API에서 반환하는 구조에 맞게 변환
        return {
          id: response.user.id,
          email: response.user.email,
          firstName: response.user.firstName,
          lastName: response.user.lastName,
          role: response.user.role,
          profileImage: response.user.profileImage || null,
          balance: response.user.balance,
          authToken: response.authToken || 'temp-token',
        } as unknown as LoginResponse;
      } catch (error: any) {
        throw new Error(error.message || 'Registration failed');
      }
    },
    onSuccess: (data: LoginResponse) => {
      setAuthToken(data.authToken);
      setAuthTokenCookie(data.authToken, false);

      const userProfile: UserProfile = {
        id: data.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        profileImage: data.profileImage || null,
        balance: data.balance || '0',
      };
      queryClient.setQueryData([USER_ROUTES.PROFILE], userProfile);
      toast({
        title: '회원가입 성공',
        description: '계정이 성공적으로 생성되었습니다.',
      });
      window.location.href = '/dashboard';
    },
    onError: (error: Error) => {
      setAuthToken(null);
      removeAuthTokenCookie();
      toast({
        title: '회원가입 실패',
        description: error.message || '계정을 생성할 수 없습니다.',
        variant: 'destructive',
      });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      try {
        await apiClient.post(AUTH_ROUTES.LOGOUT, {});
      } catch (error: any) {
        // 로그아웃은 실패해도 클라이언트에서 토큰을 제거
        console.warn('Logout API failed:', error);
      }
    },
    onSuccess: () => {
      setAuthToken(null);
      removeAuthTokenCookie();
      queryClient.setQueryData([USER_ROUTES.PROFILE], null);
      queryClient.clear();
      toast({
        title: '로그아웃',
        description: '성공적으로 로그아웃되었습니다.',
      });
      window.location.href = '/login';
    },
    onError: (error: Error) => {
      console.error('Logout error:', error);
      // 에러가 발생해도 클라이언트 사이드 정리는 수행
      setAuthToken(null);
      removeAuthTokenCookie();
      queryClient.setQueryData([USER_ROUTES.PROFILE], null);
      queryClient.clear();
      toast({
        title: '로그아웃 실패',
        description: '로그아웃 중 오류가 발생했지만 세션이 정리되었습니다.',
        variant: 'destructive',
      });
      window.location.href = '/login';
    },
  });

  const getAuthToken = () => authToken;

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: isLoadingUser,
        isAuthenticated: !!user && !!authToken,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        getAuthToken,
        twoFactorRequired,
        setTwoFactorRequired,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
