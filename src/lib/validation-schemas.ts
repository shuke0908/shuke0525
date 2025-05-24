import { z } from 'zod';

// 기본 검증 규칙
export const baseValidations = {
  email: z.string().email('올바른 이메일 주소를 입력해주세요'),
  password: z
    .string()
    .min(8, '비밀번호는 최소 8자 이상이어야 합니다')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      '비밀번호는 대소문자, 숫자, 특수문자를 포함해야 합니다'
    ),
  username: z
    .string()
    .min(3, '사용자명은 최소 3자 이상이어야 합니다')
    .max(30, '사용자명은 최대 30자까지 가능합니다')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      '사용자명은 영문, 숫자, 언더스코어만 사용 가능합니다'
    ),
  amount: z
    .string()
    .refine(
      val => !isNaN(Number(val)) && Number(val) > 0,
      '올바른 금액을 입력해주세요'
    ),
  phoneNumber: z
    .string()
    .regex(/^[+]?[\d\s\-()]{10,15}$/, '올바른 전화번호를 입력해주세요'),
  positiveNumber: z.number().positive('양수를 입력해주세요'),
  nonEmptyString: z.string().min(1, '필수 입력 항목입니다'),
};

// 사용자 관련 스키마
export const userSchemas = {
  // 로그인
  login: z.object({
    email: baseValidations.email,
    password: z.string().min(1, '비밀번호를 입력해주세요'),
    rememberMe: z.boolean().optional(),
    captchaToken: z.string().optional(),
  }),

  // 회원가입
  register: z
    .object({
      email: baseValidations.email,
      username: baseValidations.username,
      password: baseValidations.password,
      confirmPassword: z.string(),
      firstName: z.string().min(1, '이름을 입력해주세요'),
      lastName: z.string().min(1, '성을 입력해주세요'),
      country: z.string().optional(),
      phoneNumber: baseValidations.phoneNumber.optional(),
      agreeToTerms: z
        .boolean()
        .refine(val => val === true, '이용약관에 동의해주세요'),
      agreeToPrivacy: z
        .boolean()
        .refine(val => val === true, '개인정보처리방침에 동의해주세요'),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: '비밀번호가 일치하지 않습니다',
      path: ['confirmPassword'],
    }),

  // 프로필 업데이트
  updateProfile: z.object({
    firstName: z.string().min(1, '이름을 입력해주세요'),
    lastName: z.string().min(1, '성을 입력해주세요'),
    phoneNumber: baseValidations.phoneNumber.optional(),
    country: z.string().optional(),
  }),

  // 비밀번호 변경
  changePassword: z
    .object({
      currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
      newPassword: baseValidations.password,
      confirmPassword: z.string(),
    })
    .refine(data => data.newPassword === data.confirmPassword, {
      message: '새 비밀번호가 일치하지 않습니다',
      path: ['confirmPassword'],
    }),

  // 비밀번호 재설정
  forgotPassword: z.object({
    email: baseValidations.email,
  }),

  resetPassword: z
    .object({
      token: z.string().min(1, '토큰이 필요합니다'),
      password: baseValidations.password,
      confirmPassword: z.string(),
    })
    .refine(data => data.password === data.confirmPassword, {
      message: '비밀번호가 일치하지 않습니다',
      path: ['confirmPassword'],
    }),
};

// 거래 관련 스키마
export const tradeSchemas = {
  // 플래시 트레이드
  flashTrade: z.object({
    symbol: z.string().min(1, '거래 심볼을 선택해주세요'),
    amount: baseValidations.amount,
    direction: z.enum(['up', 'down'], {
      errorMap: () => ({ message: '방향을 선택해주세요' }),
    }),
    duration: z.number().positive('기간을 선택해주세요'),
  }),

  // 퀵 트레이드
  quickTrade: z.object({
    symbol: z.string().min(1, '거래 심볼을 선택해주세요'),
    amount: baseValidations.amount,
    direction: z.enum(['buy', 'sell'], {
      errorMap: () => ({ message: '방향을 선택해주세요' }),
    }),
  }),

  // 플래시 트레이드 설정
  flashTradeSettings: z.object({
    duration: z.number().positive('기간을 입력해주세요'),
    returnRate: z
      .string()
      .refine(
        val => !isNaN(Number(val)) && Number(val) >= 0,
        '올바른 수익률을 입력해주세요'
      ),
    minAmount: baseValidations.amount,
    maxAmount: baseValidations.amount,
    isActive: z.boolean(),
  }),
};

// 관리자 관련 스키마
export const adminSchemas = {
  // 사용자 관리
  updateUser: z.object({
    email: baseValidations.email.optional(),
    username: baseValidations.username.optional(),
    firstName: z.string().min(1, '이름을 입력해주세요').optional(),
    lastName: z.string().min(1, '성을 입력해주세요').optional(),
    role: z
      .enum(['user', 'admin'], {
        errorMap: () => ({ message: '올바른 역할을 선택해주세요' }),
      })
      .optional(),
    isActive: z.boolean().optional(),
    kycStatus: z
      .enum(['pending', 'approved', 'rejected', 'not_submitted'])
      .optional(),
  }),

  // 사용자 생성
  createUser: z.object({
    email: baseValidations.email,
    username: baseValidations.username,
    password: baseValidations.password,
    firstName: z.string().min(1, '이름을 입력해주세요'),
    lastName: z.string().min(1, '성을 입력해주세요'),
    role: z.enum(['user', 'admin'], {
      errorMap: () => ({ message: '역할을 선택해주세요' }),
    }),
  }),

  // 잔액 조정
  adjustBalance: z.object({
    operation: z.enum(['increase', 'decrease'], {
      errorMap: () => ({ message: '작업을 선택해주세요' }),
    }),
    amount: baseValidations.amount,
    reason: z.string().min(1, '사유를 입력해주세요'),
  }),

  // 시스템 설정
  systemSettings: z.object({
    maintenanceMode: z.boolean(),
    registrationEnabled: z.boolean(),
    kycRequired: z.boolean(),
    withdrawalEnabled: z.boolean(),
    tradingEnabled: z.boolean(),
    minDepositAmount: baseValidations.amount,
    maxWithdrawalAmount: baseValidations.amount,
    withdrawalFeePercent: z
      .string()
      .refine(
        val => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
        '0-100 사이의 값을 입력해주세요'
      ),
    tradingFeePercent: z
      .string()
      .refine(
        val => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100,
        '0-100 사이의 값을 입력해주세요'
      ),
  }),

  // KYC 승인/거부
  kycApprove: z.object({
    notes: z.string().optional(),
  }),

  kycReject: z.object({
    reason: z.string().min(1, '거부 사유를 입력해주세요'),
  }),
};

// 금융 관련 스키마
export const financeSchemas = {
  // 입금
  deposit: z.object({
    amount: baseValidations.amount,
    method: z.enum(['bank_transfer', 'card', 'crypto'], {
      errorMap: () => ({ message: '입금 방법을 선택해주세요' }),
    }),
    reference: z.string().optional(),
  }),

  // 출금
  withdrawal: z.object({
    amount: baseValidations.amount,
    method: z.enum(['bank_transfer', 'crypto'], {
      errorMap: () => ({ message: '출금 방법을 선택해주세요' }),
    }),
    address: z.string().min(1, '출금 주소를 입력해주세요'),
    notes: z.string().optional(),
  }),
};

// KYC 관련 스키마
export const kycSchemas = {
  personalInfo: z.object({
    firstName: z.string().min(1, '이름을 입력해주세요'),
    lastName: z.string().min(1, '성을 입력해주세요'),
    dateOfBirth: z.string().min(1, '생년월일을 입력해주세요'),
    nationality: z.string().min(1, '국적을 선택해주세요'),
    address: z.string().min(1, '주소를 입력해주세요'),
    city: z.string().min(1, '도시를 입력해주세요'),
    postalCode: z.string().min(1, '우편번호를 입력해주세요'),
    country: z.string().min(1, '국가를 선택해주세요'),
    phoneNumber: baseValidations.phoneNumber,
    idNumber: z.string().min(1, '신분증 번호를 입력해주세요'),
    idType: z.enum(['passport', 'id_card', 'drivers_license'], {
      errorMap: () => ({ message: '신분증 타입을 선택해주세요' }),
    }),
  }),
};

// 알림 관련 스키마
export const notificationSchemas = {
  create: z.object({
    title: z.string().min(1, '제목을 입력해주세요'),
    message: z.string().min(1, '메시지를 입력해주세요'),
    type: z.enum(['info', 'success', 'warning', 'error'], {
      errorMap: () => ({ message: '알림 타입을 선택해주세요' }),
    }),
    isGlobal: z.boolean(),
    priority: z.enum(['low', 'medium', 'high'], {
      errorMap: () => ({ message: '우선순위를 선택해주세요' }),
    }),
    actionUrl: z.string().url('올바른 URL을 입력해주세요').optional(),
    expiresAt: z.string().optional(),
  }),
};

// 페이지네이션 스키마
export const paginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// API 응답 스키마
export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data: dataSchema.optional(),
    error: z.string().optional(),
  });

// 페이지네이션된 응답 스키마
export const paginatedResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: z.array(dataSchema),
    pagination: z.object({
      total: z.number(),
      totalPages: z.number(),
      currentPage: z.number(),
      limit: z.number(),
    }),
  });

// 유틸리티 함수들
export const createFormSchema = <T extends z.ZodType>(schema: T) => schema;

export const validateWithSchema = <T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: boolean; data?: T; errors?: string[] } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(
          err => `${err.path.join('.')}: ${err.message}`
        ),
      };
    }
    return { success: false, errors: ['알 수 없는 검증 오류가 발생했습니다'] };
  }
};

// TypeScript 타입 추출
export type LoginForm = z.infer<typeof userSchemas.login>;
export type RegisterForm = z.infer<typeof userSchemas.register>;
export type UpdateProfileForm = z.infer<typeof userSchemas.updateProfile>;
export type ChangePasswordForm = z.infer<typeof userSchemas.changePassword>;
export type FlashTradeForm = z.infer<typeof tradeSchemas.flashTrade>;
export type QuickTradeForm = z.infer<typeof tradeSchemas.quickTrade>;
export type AdminUpdateUserForm = z.infer<typeof adminSchemas.updateUser>;
export type AdminCreateUserForm = z.infer<typeof adminSchemas.createUser>;
export type SystemSettingsForm = z.infer<typeof adminSchemas.systemSettings>;
export type KycPersonalInfoForm = z.infer<typeof kycSchemas.personalInfo>;
export type PaginationParams = z.infer<typeof paginationSchema>;

// 전체 스키마 내보내기
export const schemas = {
  user: userSchemas,
  trade: tradeSchemas,
  admin: adminSchemas,
  finance: financeSchemas,
  kyc: kycSchemas,
  notification: notificationSchemas,
  pagination: paginationSchema,
  apiResponse: apiResponseSchema,
  paginatedResponse: paginatedResponseSchema,
};
