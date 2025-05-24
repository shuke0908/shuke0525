import { useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { errorHandler, ERROR_MESSAGES } from '@/lib/error-handler';
import type { ApiError } from '@/types';

export const useErrorHandler = () => {
  const showErrorToast = useCallback(
    (error: ApiError) => {
      toast({
        title: '오류가 발생했습니다',
        description: error.message || ERROR_MESSAGES.SERVER_ERROR,
        variant: 'destructive',
      });
    },
    []
  );

  const handleError = useCallback(
    (error: any) => {
      return errorHandler.handleClientError(error, showErrorToast);
    },
    [showErrorToast]
  );

  const handleQueryError = useCallback((error: any) => {
    return errorHandler.handleQueryError(error);
  }, []);

  return {
    handleError,
    handleQueryError,
    showErrorToast,
  };
};
