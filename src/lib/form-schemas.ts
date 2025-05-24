import { z } from 'zod';

// 공통 유효성 검증 함수들
const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// 기본 필드 스키마들
export const baseSchemas = {
  email: z
    .string()
    .min(1, '이메일을 입력해주세요.')
    .email('올바른 이메일 형식이 아닙니다.'),

  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다.')
    .max(50, '비밀번호는 최대 50자까지 입력 가능합니다.')
    .regex(passwordRegex, '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.'),

  phone: z
    .string()
    .min(1, '전화번호를 입력해주세요.')
    .regex(phoneRegex, '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)'),

  name: z
    .string()
    .min(1, '이름을 입력해주세요.')
    .min(2, '이름은 최소 2자 이상이어야 합니다.')
    .max(20, '이름은 최대 20자까지 입력 가능합니다.'),

  amount: z
    .string()
    .min(1, '금액을 입력해주세요.')
    .refine(
      val => !isNaN(Number(val)) && Number(val) > 0,
      '올바른 금액을 입력해주세요.'
    ),

  required: (message: string = '필수 항목입니다.') =>
    z.string().min(1, message),

  optional: z.string().optional(),
};

// 로그인 스키마
export const loginSchema = z.object({
  email: baseSchemas.email,
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
  rememberMe: z.boolean().optional(),
  captchaToken: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// 회원가입 스키마
export const registerSchema = z
  .object({
    email: baseSchemas.email,
    password: baseSchemas.password,
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요.'),
    name: baseSchemas.name,
    phone: baseSchemas.phone,
    agreeTerms: z
      .boolean()
      .refine(val => val === true, '이용약관에 동의해주세요.'),
    agreePrivacy: z
      .boolean()
      .refine(val => val === true, '개인정보처리방침에 동의해주세요.'),
    agreeMarketing: z.boolean().optional(),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

// 프로필 수정 스키마
export const profileUpdateSchema = z.object({
  name: baseSchemas.name,
  phone: baseSchemas.phone,
  bio: z.string().max(500, '소개는 최대 500자까지 입력 가능합니다.').optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

// 비밀번호 변경 스키마
export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요.'),
    newPassword: baseSchemas.password,
    confirmPassword: z.string().min(1, '새 비밀번호 확인을 입력해주세요.'),
  })
  .refine(data => data.newPassword === data.confirmPassword, {
    message: '새 비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: '새 비밀번호는 현재 비밀번호와 달라야 합니다.',
    path: ['newPassword'],
  });

export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;

// Flash Trade 생성 스키마
export const flashTradeSchema = z.object({
  amount: baseSchemas.amount,
  direction: z.enum(['up', 'down'], {
    errorMap: () => ({ message: '거래 방향을 선택해주세요.' }),
  }),
  duration: z
    .string()
    .min(1, '거래 시간을 선택해주세요.')
    .refine(
      val => ['30', '60', '120', '300'].includes(val),
      '올바른 거래 시간을 선택해주세요.'
    ),
  asset: z.string().min(1, '거래 자산을 선택해주세요.'),
});

export type FlashTradeFormData = z.infer<typeof flashTradeSchema>;

// Quick Trade 생성 스키마
export const quickTradeSchema = z.object({
  amount: baseSchemas.amount,
  direction: z.enum(['buy', 'sell'], {
    errorMap: () => ({ message: '거래 방향을 선택해주세요.' }),
  }),
  asset: z.string().min(1, '거래 자산을 선택해주세요.'),
  leverage: z
    .string()
    .min(1, '레버리지를 선택해주세요.')
    .refine(
      val => ['1', '2', '5', '10', '20'].includes(val),
      '올바른 레버리지를 선택해주세요.'
    ),
  stopLoss: z.string().optional(),
  takeProfit: z.string().optional(),
});

export type QuickTradeFormData = z.infer<typeof quickTradeSchema>;

// 입금 요청 스키마
export const depositSchema = z.object({
  amount: baseSchemas.amount,
  method: z.enum(['bank', 'card', 'crypto'], {
    errorMap: () => ({ message: '입금 방법을 선택해주세요.' }),
  }),
  bankAccount: z.string().optional(),
  memo: z
    .string()
    .max(200, '메모는 최대 200자까지 입력 가능합니다.')
    .optional(),
});

export type DepositFormData = z.infer<typeof depositSchema>;

// 출금 요청 스키마
export const withdrawalSchema = z.object({
  amount: baseSchemas.amount,
  method: z.enum(['bank', 'crypto'], {
    errorMap: () => ({ message: '출금 방법을 선택해주세요.' }),
  }),
  bankAccount: z.string().min(1, '출금 계좌를 입력해주세요.'),
  bankName: z.string().min(1, '은행명을 입력해주세요.'),
  accountHolder: z.string().min(1, '예금주명을 입력해주세요.'),
  password: z.string().min(1, '거래 비밀번호를 입력해주세요.'),
});

export type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

// KYC 인증 스키마
export const kycSchema = z.object({
  name: baseSchemas.name,
  idNumber: z
    .string()
    .min(1, '주민등록번호를 입력해주세요.')
    .regex(/^\d{6}-\d{7}$/, '올바른 주민등록번호 형식이 아닙니다.'),
  address: z.string().min(1, '주소를 입력해주세요.'),
  occupation: z.string().min(1, '직업을 입력해주세요.'),
  income: z.enum(['under_30', '30_50', '50_100', 'over_100'], {
    errorMap: () => ({ message: '소득 구간을 선택해주세요.' }),
  }),
  purpose: z.enum(['investment', 'trading', 'saving', 'other'], {
    errorMap: () => ({ message: '거래 목적을 선택해주세요.' }),
  }),
});

export type KycFormData = z.infer<typeof kycSchema>;

// 관리자 - 사용자 잔액 조정 스키마
export const balanceAdjustmentSchema = z.object({
  userId: z.string().min(1, '사용자를 선택해주세요.'),
  amount: baseSchemas.amount,
  type: z.enum(['add', 'subtract'], {
    errorMap: () => ({ message: '조정 유형을 선택해주세요.' }),
  }),
  reason: z
    .string()
    .min(1, '조정 사유를 입력해주세요.')
    .max(200, '사유는 최대 200자까지 입력 가능합니다.'),
});

export type BalanceAdjustmentFormData = z.infer<typeof balanceAdjustmentSchema>;

// 관리자 - 거래 결과 설정 스키마
export const tradeResultSchema = z.object({
  tradeId: z.string().min(1, '거래 ID를 입력해주세요.'),
  result: z.enum(['win', 'lose'], {
    errorMap: () => ({ message: '거래 결과를 선택해주세요.' }),
  }),
  reason: z
    .string()
    .max(200, '사유는 최대 200자까지 입력 가능합니다.')
    .optional(),
});

export type TradeResultFormData = z.infer<typeof tradeResultSchema>;

// 지원 티켓 생성 스키마
export const supportTicketSchema = z.object({
  category: z.enum(['technical', 'account', 'trading', 'payment', 'other'], {
    errorMap: () => ({ message: '문의 카테고리를 선택해주세요.' }),
  }),
  subject: z
    .string()
    .min(1, '제목을 입력해주세요.')
    .max(100, '제목은 최대 100자까지 입력 가능합니다.'),
  description: z
    .string()
    .min(1, '문의 내용을 입력해주세요.')
    .max(1000, '문의 내용은 최대 1000자까지 입력 가능합니다.'),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: '우선순위를 선택해주세요.' }),
  }),
});

export type SupportTicketFormData = z.infer<typeof supportTicketSchema>;

// 유틸리티 함수: 스키마 에러를 폼 에러 형태로 변환
export function getFormErrors(error: z.ZodError) {
  const formErrors: Record<string, string> = {};

  error.errors.forEach(err => {
    const path = err.path.join('.');
    if (!formErrors[path]) {
      formErrors[path] = err.message;
    }
  });

  return formErrors;
}

// 유틸리티 함수: 안전한 파싱
export function safeParseForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): {
  success: boolean;
  data?: T;
  errors?: Record<string, string>;
} {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return {
    success: false,
    errors: getFormErrors(result.error),
  };
}
