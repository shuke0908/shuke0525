'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';


import { useToast } from '../../hooks/use-toast';

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

interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin' | 'superadmin';
  balance: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type LoginData = {
  email: string;
  password: string;
  captchaToken?: string;
  rememberMe?: boolean;
};

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
  if (typeof document !== 'undefined' && typeof window !== 'undefined') {
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  // 인증 상태 확인
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user) {
          setUser(result.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 로그인
  const login = async (email: string, password: string, rememberMe = false) => {
    setIsLoading(true);
    
    try {
      console.log('🔐 AuthProvider: Attempting login with:', { email, rememberMe });
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const result = await response.json();
      console.log('📊 AuthProvider: Login response:', { status: response.status, result });

      if (!response.ok) {
        throw new Error(result.error || 'Login failed');
      }

      if (result.success && result.user) {
        // API 응답 구조에 맞게 사용자 정보 변환
        const transformedUser = {
          id: result.user.id,
          email: result.user.email,
          username: result.user.nickname || result.user.email,
          role: result.user.role,
          balance: parseFloat(result.user.balance || '0'),
          isActive: result.user.isActive,
          createdAt: new Date(result.user.createdAt),
          updatedAt: new Date(result.user.updatedAt)
        };
        
        console.log('✅ AuthProvider: Setting user:', transformedUser);
        setUser(transformedUser);
        
        // 토큰을 쿠키에 저장
        if (result.tokens?.accessToken) {
          setAuthTokenCookie(result.tokens.accessToken, rememberMe);
        }
      }
    } catch (error) {
      console.error('❌ AuthProvider: Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 로그아웃
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      router.push('/auth/login');
    }
  };

  // 토큰 갱신
  const refreshToken = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.user) {
          setUser(result.user);
        }
      } else {
        // 리프레시 실패 시 로그아웃
        setUser(null);
        router.push('/auth/login');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      setUser(null);
      router.push('/auth/login');
    }
  };

  // 컴포넌트 마운트 시 인증 상태 확인
  useEffect(() => {
    checkAuth();
  }, []);

  // 토큰 자동 갱신 (25분마다)
  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        refreshToken();
      }, 25 * 60 * 1000); // 25분

      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshToken,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// 인증이 필요한 컴포넌트를 감싸는 HOC
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  requiredRole?: 'user' | 'admin' | 'superadmin'
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading) {
        if (!user) {
          router.push('/auth/login');
          return;
        }

        if (requiredRole) {
          const roleHierarchy = {
            user: 0,
            admin: 1,
            superadmin: 2
          };

          const userLevel = roleHierarchy[user.role] || -1;
          const requiredLevel = roleHierarchy[requiredRole] || 999;

          if (userLevel < requiredLevel) {
            router.push('/auth/forbidden');
            return;
          }
        }
      }
    }, [user, isLoading, router]);

    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!user) {
      return null;
    }

    if (requiredRole) {
      const roleHierarchy = {
        user: 0,
        admin: 1,
        superadmin: 2
      };

      const userLevel = roleHierarchy[user.role] || -1;
      const requiredLevel = roleHierarchy[requiredRole] || 999;

      if (userLevel < requiredLevel) {
        return null;
      }
    }

    return <Component {...props} />;
  };
}
