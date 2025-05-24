import {
  useForm as useReactHookForm,
} from 'react-hook-form';
import type {
  UseFormProps,
  UseFormReturn,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/hooks/use-toast';

interface UseFormOptions<TSchema extends z.ZodSchema>
  extends Omit<UseFormProps<z.infer<TSchema>>, 'resolver'> {
  schema: TSchema;
  onSubmit?: (_data: z.infer<TSchema>) => Promise<void> | void;
  onError?: (_error: any) => void;
  showToastOnSuccess?: boolean;
  showToastOnError?: boolean;
  successMessage?: string;
}

export function useForm<TSchema extends z.ZodSchema>({
  schema,
  onSubmit,
  onError,
  showToastOnSuccess = false,
  showToastOnError = true,
  successMessage = '성공적으로 처리되었습니다.',
  ...options
}: UseFormOptions<TSchema>): UseFormReturn<z.infer<TSchema>> & {
  handleFormSubmit: (_e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
} {
  const form = useReactHookForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    ...options,
  });

  const handleSubmit = async (_e?: React.BaseSyntheticEvent) => {
    if (_e) {
      _e.preventDefault();
    }

    try {
      await form.handleSubmit(async data => {
        try {
          await onSubmit?.(data);

          if (showToastOnSuccess) {
            toast({
              title: '성공',
              description: successMessage,
              variant: 'default',
            });
          }
        } catch (_error) {
          console.error('Form submission error:', _error);

          if (onError) {
            onError(_error);
          }

          if (showToastOnError) {
            const errorMessage =
              _error instanceof Error
                ? _error.message
                : '처리 중 오류가 발생했습니다.';
            toast({
              title: '오류',
              description: errorMessage,
              variant: 'destructive',
            });
          }

          throw _error; // Re-throw to prevent success toast
        }
      })(_e);
    } catch (_error) {
      // Error already handled above
    }
  };

  return {
    ...form,
    handleFormSubmit: handleSubmit,
    isSubmitting: form.formState.isSubmitting,
  };
}

// 특정 스키마를 위한 전용 훅들
export function useLoginForm(
  options?: Omit<
    UseFormOptions<typeof import('@/lib/form-schemas').loginSchema>,
    'schema'
  >
) {
  const { loginSchema } = require('@/lib/form-schemas');
  return useForm({
    schema: loginSchema,
    showToastOnError: true,
    ...options,
  });
}

export function useRegisterForm(
  options?: Omit<
    UseFormOptions<typeof import('@/lib/form-schemas').registerSchema>,
    'schema'
  >
) {
  const { registerSchema } = require('@/lib/form-schemas');
  return useForm({
    schema: registerSchema,
    showToastOnError: true,
    ...options,
  });
}

export function useFlashTradeForm(
  options?: Omit<
    UseFormOptions<typeof import('@/lib/form-schemas').flashTradeSchema>,
    'schema'
  >
) {
  const { flashTradeSchema } = require('@/lib/form-schemas');
  return useForm({
    schema: flashTradeSchema,
    showToastOnSuccess: true,
    successMessage: 'Flash Trade가 생성되었습니다.',
    ...options,
  });
}

export function useProfileUpdateForm(
  options?: Omit<
    UseFormOptions<typeof import('@/lib/form-schemas').profileUpdateSchema>,
    'schema'
  >
) {
  const { profileUpdateSchema } = require('@/lib/form-schemas');
  return useForm({
    schema: profileUpdateSchema,
    showToastOnSuccess: true,
    successMessage: '프로필이 업데이트되었습니다.',
    ...options,
  });
}

export function usePasswordChangeForm(
  options?: Omit<
    UseFormOptions<typeof import('@/lib/form-schemas').passwordChangeSchema>,
    'schema'
  >
) {
  const { passwordChangeSchema } = require('@/lib/form-schemas');
  return useForm({
    schema: passwordChangeSchema,
    showToastOnSuccess: true,
    successMessage: '비밀번호가 변경되었습니다.',
    ...options,
  });
}

export function useDepositForm(
  options?: Omit<
    UseFormOptions<typeof import('@/lib/form-schemas').depositSchema>,
    'schema'
  >
) {
  const { depositSchema } = require('@/lib/form-schemas');
  return useForm({
    schema: depositSchema,
    showToastOnSuccess: true,
    successMessage: '입금 요청이 제출되었습니다.',
    ...options,
  });
}

export function useWithdrawalForm(
  options?: Omit<
    UseFormOptions<typeof import('@/lib/form-schemas').withdrawalSchema>,
    'schema'
  >
) {
  const { withdrawalSchema } = require('@/lib/form-schemas');
  return useForm({
    schema: withdrawalSchema,
    showToastOnSuccess: true,
    successMessage: '출금 요청이 제출되었습니다.',
    ...options,
  });
}

export function useKycForm(
  options?: Omit<
    UseFormOptions<typeof import('@/lib/form-schemas').kycSchema>,
    'schema'
  >
) {
  const { kycSchema } = require('@/lib/form-schemas');
  return useForm({
    schema: kycSchema,
    showToastOnSuccess: true,
    successMessage: 'KYC 인증 정보가 제출되었습니다.',
    ...options,
  });
}

// 관리자용 폼 훅들
export function useBalanceAdjustmentForm(
  options?: Omit<
    UseFormOptions<typeof import('@/lib/form-schemas').balanceAdjustmentSchema>,
    'schema'
  >
) {
  const { balanceAdjustmentSchema } = require('@/lib/form-schemas');
  return useForm({
    schema: balanceAdjustmentSchema,
    showToastOnSuccess: true,
    successMessage: '잔액이 조정되었습니다.',
    ...options,
  });
}

export function useTradeResultForm(
  options?: Omit<
    UseFormOptions<typeof import('@/lib/form-schemas').tradeResultSchema>,
    'schema'
  >
) {
  const { tradeResultSchema } = require('@/lib/form-schemas');
  return useForm({
    schema: tradeResultSchema,
    showToastOnSuccess: true,
    successMessage: '거래 결과가 설정되었습니다.',
    ...options,
  });
}

export function useSupportTicketForm(
  options?: Omit<
    UseFormOptions<typeof import('@/lib/form-schemas').supportTicketSchema>,
    'schema'
  >
) {
  const { supportTicketSchema } = require('@/lib/form-schemas');
  return useForm({
    schema: supportTicketSchema,
    showToastOnSuccess: true,
    successMessage: '지원 티켓이 생성되었습니다.',
    ...options,
  });
}

export default useForm;
