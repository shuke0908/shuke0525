'use client';

import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps> | undefined;
  onError?: ((_error: Error, _errorInfo: React.ErrorInfo) => void) | undefined;
  resetKeys?: Array<string | number> | undefined;
  resetOnPropsChange?: boolean | undefined;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export interface ErrorFallbackProps {
  error: Error | null;
  resetError: () => void;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error, _errorInfo: React.ErrorInfo): State {
    return {
      hasError: true,
      error: _error,
      errorInfo: _errorInfo,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // 부모 컴포넌트에서 제공한 에러 핸들러 호출
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // 프로덕션 환경에서는 에러 리포팅 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys?.some((key, idx) => prevProps.resetKeys?.[idx] !== key)) {
        this.resetError();
      }
    }

    if (
      hasError &&
      resetOnPropsChange &&
      prevProps.children !== this.props.children
    ) {
      this.resetError();
    }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private reportErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // 실제 에러 리포팅 서비스와 연동
    // 예: Sentry, LogRocket, Bugsnag 등
    try {
      // 에러 정보를 수집하여 서버로 전송
      const errorReport = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // 실제 구현에서는 여기서 API 호출
      console.log('Error reported:', errorReport);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback } = this.props;

      if (Fallback) {
        return (
          <Fallback
            error={this.state.error}
            resetError={this.resetError}
            errorInfo={this.state.errorInfo}
          />
        );
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          resetError={this.resetError}
          errorInfo={this.state.errorInfo}
        />
      );
    }

    return this.props.children;
  }
}

// 기본 에러 화면 컴포넌트
function DefaultErrorFallback({ error, resetError, errorInfo: _errorInfo }: ErrorFallbackProps) {
  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 px-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 w-12 h-12 text-red-500'>
            <AlertTriangle className='w-full h-full' />
          </div>
          <CardTitle className='text-xl font-semibold text-gray-900'>
            문제가 발생했습니다
          </CardTitle>
          <CardDescription className='text-gray-600'>
            예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해주세요.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {process.env.NODE_ENV === 'development' && error && (
            <details className='mt-4 p-3 bg-gray-100 rounded text-sm'>
              <summary className='cursor-pointer font-medium text-gray-700 mb-2'>
                오류 세부사항 (개발 모드)
              </summary>
              <pre className='whitespace-pre-wrap text-xs text-gray-600 overflow-auto'>
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </CardContent>

        <CardFooter className='flex flex-col gap-2'>
          <Button onClick={resetError} className='w-full' variant='default'>
            <RefreshCw className='w-4 h-4 mr-2' />
            다시 시도
          </Button>

          <div className='flex gap-2 w-full'>
            <Button onClick={handleReload} variant='outline' className='flex-1'>
              페이지 새로고침
            </Button>
            <Button onClick={handleGoHome} variant='outline' className='flex-1'>
              <Home className='w-4 h-4 mr-2' />
              홈으로
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

// 특정 영역용 작은 에러 화면
export function CompactErrorFallback({
  error,
  resetError,
}: ErrorFallbackProps) {
  return (
    <div className='flex flex-col items-center justify-center p-6 text-center bg-gray-50 rounded-lg border'>
      <AlertTriangle className='w-8 h-8 text-red-500 mb-3' />
      <h3 className='text-sm font-medium text-gray-900 mb-1'>
        오류가 발생했습니다
      </h3>
      <p className='text-xs text-gray-600 mb-4'>
        이 영역을 불러오는 중 문제가 발생했습니다.
      </p>
      <Button onClick={resetError} size='sm' variant='outline'>
        <RefreshCw className='w-3 h-3 mr-1' />
        다시 시도
      </Button>

      {process.env.NODE_ENV === 'development' && error && (
        <details className='mt-3 w-full'>
          <summary className='text-xs text-gray-500 cursor-pointer'>
            에러 정보
          </summary>
          <pre className='text-xs text-gray-600 mt-1 text-left overflow-auto'>
            {error.message}
          </pre>
        </details>
      )}
    </div>
  );
}

// HOC로 사용할 수 있는 withErrorBoundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorFallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default ErrorBoundary;
