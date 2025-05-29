/**
 * 모듈화된 API 라우트 시스템
 * 거대한 server/routes.ts 파일을 기능별로 분리하여 유지보수성 향상
 */

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

// 공통 인터페이스
export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
  };
}

export interface RouteModule {
  path: string;
  router: Router;
  middleware?: Array<(req: Request, res: Response, next: NextFunction) => void>;
}

// 공통 응답 헬퍼
export class ApiResponse {
  static success(data: any, message?: string) {
    return {
      success: true,
      message: message || 'Operation successful',
      data,
      timestamp: new Date().toISOString(),
    };
  }

  static error(message: string, code?: string, statusCode = 400) {
    return {
      success: false,
      error: message,
      code: code || 'OPERATION_FAILED',
      timestamp: new Date().toISOString(),
    };
  }

  static validation(errors: any[]) {
    return {
      success: false,
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors,
      timestamp: new Date().toISOString(),
    };
  }
}

// 공통 미들웨어
export const commonMiddleware = {
  // 인증 확인
  authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // 실제 인증 로직 구현
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json(ApiResponse.error('Authentication required', 'UNAUTHORIZED'));
    }
    // JWT 검증 로직
    next();
  },

  // 관리자 권한 확인
  requireAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json(ApiResponse.error('Admin access required', 'FORBIDDEN'));
    }
    next();
  },

  // 슈퍼 관리자 권한 확인
  requireSuperAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== 'superadmin') {
      return res.status(403).json(ApiResponse.error('Super admin access required', 'FORBIDDEN'));
    }
    next();
  },

  // 요청 검증
  validate: (schema: z.ZodSchema) => {
    return (req: Request, res: Response, next: NextFunction) => {
      try {
        schema.parse(req.body);
        next();
      } catch (error: any) {
        return res.status(400).json(ApiResponse.validation(error.errors || []));
      }
    };
  },

  // 에러 핸들링
  errorHandler: (error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('API Error:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json(ApiResponse.error(error.message, 'VALIDATION_ERROR'));
    }
    
    if (error.name === 'UnauthorizedError') {
      return res.status(401).json(ApiResponse.error(error.message, 'UNAUTHORIZED'));
    }
    
    return res.status(500).json(ApiResponse.error('Internal server error', 'INTERNAL_ERROR'));
  },
};

// 인증 라우트 모듈
export function createAuthRoutes(): RouteModule {
  const router = Router();

  // 로그인
  router.post('/login', commonMiddleware.validate(z.object({
    email: z.string().email(),
    password: z.string().min(6),
  })), async (req: Request, res: Response) => {
    try {
      // 로그인 로직 구현
      const { email, password } = req.body;
      // ... 인증 처리
      res.json(ApiResponse.success({ token: 'jwt-token', user: {} }));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  });

  // 회원가입
  router.post('/register', commonMiddleware.validate(z.object({
    email: z.string().email(),
    password: z.string().min(6),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  })), async (req: Request, res: Response) => {
    try {
      // 회원가입 로직 구현
      res.json(ApiResponse.success({ message: 'Registration successful' }));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  });

  // 토큰 갱신
  router.post('/refresh', async (req: Request, res: Response) => {
    try {
      // 토큰 갱신 로직
      res.json(ApiResponse.success({ token: 'new-jwt-token' }));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  });

  return {
    path: '/auth',
    router,
    middleware: [commonMiddleware.errorHandler],
  };
}

// 사용자 라우트 모듈
export function createUserRoutes(): RouteModule {
  const router = Router();

  // 프로필 조회
  router.get('/profile', commonMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 프로필 조회 로직
      res.json(ApiResponse.success(req.user));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  });

  // 프로필 업데이트
  router.put('/profile', 
    commonMiddleware.authenticate,
    commonMiddleware.validate(z.object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      nickname: z.string().optional(),
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // 프로필 업데이트 로직
        res.json(ApiResponse.success({ message: 'Profile updated' }));
      } catch (error: any) {
        res.status(400).json(ApiResponse.error(error.message));
      }
    }
  );

  // 잔액 조회
  router.get('/balance', commonMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 잔액 조회 로직
      res.json(ApiResponse.success({ balance: '10000.00' }));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  });

  return {
    path: '/user',
    router,
    middleware: [commonMiddleware.errorHandler],
  };
}

// 거래 라우트 모듈
export function createTradingRoutes(): RouteModule {
  const router = Router();

  // Flash Trade 생성
  router.post('/flash-trade', 
    commonMiddleware.authenticate,
    commonMiddleware.validate(z.object({
      amount: z.number().min(1),
      direction: z.enum(['up', 'down']),
      duration: z.number().min(30),
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // Flash Trade 생성 로직
        res.json(ApiResponse.success({ tradeId: 'trade-123' }));
      } catch (error: any) {
        res.status(400).json(ApiResponse.error(error.message));
      }
    }
  );

  // Quick Trade 생성
  router.post('/quick-trade',
    commonMiddleware.authenticate,
    commonMiddleware.validate(z.object({
      amount: z.number().min(1),
      side: z.enum(['buy', 'sell']),
      leverage: z.number().min(1).max(200),
      symbol: z.string(),
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // Quick Trade 생성 로직
        res.json(ApiResponse.success({ positionId: 'position-123' }));
      } catch (error: any) {
        res.status(400).json(ApiResponse.error(error.message));
      }
    }
  );

  // Quant AI 투자
  router.post('/quant-ai',
    commonMiddleware.authenticate,
    commonMiddleware.validate(z.object({
      amount: z.number().min(100),
      strategy: z.enum(['conservative', 'balanced', 'aggressive']),
      period: z.number().min(1),
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // Quant AI 투자 로직
        res.json(ApiResponse.success({ investmentId: 'investment-123' }));
      } catch (error: any) {
        res.status(400).json(ApiResponse.error(error.message));
      }
    }
  );

  // 활성 거래 조회
  router.get('/active', commonMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 활성 거래 조회 로직
      res.json(ApiResponse.success({ trades: [] }));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  });

  // 거래 내역 조회
  router.get('/history', commonMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 거래 내역 조회 로직
      res.json(ApiResponse.success({ trades: [] }));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  });

  return {
    path: '/trading',
    router,
    middleware: [commonMiddleware.errorHandler],
  };
}

// 지갑 라우트 모듈
export function createWalletRoutes(): RouteModule {
  const router = Router();

  // 입금 신청
  router.post('/deposit',
    commonMiddleware.authenticate,
    commonMiddleware.validate(z.object({
      amount: z.number().min(1),
      coin: z.string(),
      network: z.string().optional(),
      txHash: z.string().optional(),
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // 입금 신청 로직
        res.json(ApiResponse.success({ depositId: 'deposit-123' }));
      } catch (error: any) {
        res.status(400).json(ApiResponse.error(error.message));
      }
    }
  );

  // 출금 신청
  router.post('/withdraw',
    commonMiddleware.authenticate,
    commonMiddleware.validate(z.object({
      amount: z.number().min(1),
      coin: z.string(),
      address: z.string(),
      withdrawalPassword: z.string(),
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // 출금 신청 로직
        res.json(ApiResponse.success({ withdrawalId: 'withdrawal-123' }));
      } catch (error: any) {
        res.status(400).json(ApiResponse.error(error.message));
      }
    }
  );

  // 거래 내역 조회
  router.get('/transactions', commonMiddleware.authenticate, async (req: AuthenticatedRequest, res: Response) => {
    try {
      // 거래 내역 조회 로직
      res.json(ApiResponse.success({ transactions: [] }));
    } catch (error: any) {
      res.status(400).json(ApiResponse.error(error.message));
    }
  });

  return {
    path: '/wallet',
    router,
    middleware: [commonMiddleware.errorHandler],
  };
}

// 관리자 라우트 모듈
export function createAdminRoutes(): RouteModule {
  const router = Router();

  // 사용자 관리
  router.get('/users', 
    commonMiddleware.authenticate,
    commonMiddleware.requireAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // 사용자 목록 조회 로직
        res.json(ApiResponse.success({ users: [] }));
      } catch (error: any) {
        res.status(400).json(ApiResponse.error(error.message));
      }
    }
  );

  // 사용자 상태 변경
  router.put('/users/:userId/status',
    commonMiddleware.authenticate,
    commonMiddleware.requireAdmin,
    commonMiddleware.validate(z.object({
      status: z.enum(['active', 'suspended', 'banned']),
      reason: z.string().optional(),
    })),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // 사용자 상태 변경 로직
        res.json(ApiResponse.success({ message: 'User status updated' }));
      } catch (error: any) {
        res.status(400).json(ApiResponse.error(error.message));
      }
    }
  );

  // 거래 설정 관리
  router.get('/trading-settings', 
    commonMiddleware.authenticate,
    commonMiddleware.requireAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // 거래 설정 조회 로직
        res.json(ApiResponse.success({ settings: {} }));
      } catch (error: any) {
        res.status(400).json(ApiResponse.error(error.message));
      }
    }
  );

  router.put('/trading-settings',
    commonMiddleware.authenticate,
    commonMiddleware.requireAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // 거래 설정 업데이트 로직
        res.json(ApiResponse.success({ message: 'Settings updated' }));
      } catch (error: any) {
        res.status(400).json(ApiResponse.error(error.message));
      }
    }
  );

  // 입출금 승인
  router.put('/deposits/:depositId/approve',
    commonMiddleware.authenticate,
    commonMiddleware.requireAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // 입금 승인 로직
        res.json(ApiResponse.success({ message: 'Deposit approved' }));
      } catch (error: any) {
        res.status(400).json(ApiResponse.error(error.message));
      }
    }
  );

  router.put('/withdrawals/:withdrawalId/approve',
    commonMiddleware.authenticate,
    commonMiddleware.requireAdmin,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        // 출금 승인 로직
        res.json(ApiResponse.success({ message: 'Withdrawal approved' }));
      } catch (error: any) {
        res.status(400).json(ApiResponse.error(error.message));
      }
    }
  );

  return {
    path: '/admin',
    router,
    middleware: [commonMiddleware.errorHandler],
  };
}

// 라우트 등록기
export class RouteRegistry {
  private modules: RouteModule[] = [];

  register(module: RouteModule) {
    this.modules.push(module);
  }

  registerAll() {
    this.register(createAuthRoutes());
    this.register(createUserRoutes());
    this.register(createTradingRoutes());
    this.register(createWalletRoutes());
    this.register(createAdminRoutes());
  }

  applyToApp(app: any) {
    this.modules.forEach(module => {
      if (module.middleware) {
        app.use(module.path, ...module.middleware, module.router);
      } else {
        app.use(module.path, module.router);
      }
    });
  }

  getModules(): RouteModule[] {
    return this.modules;
  }
}

// 사용 예시
export function setupModularRoutes(app: any) {
  const registry = new RouteRegistry();
  registry.registerAll();
  registry.applyToApp(app);
  
  console.log(`✅ Registered ${registry.getModules().length} route modules`);
  return registry;
} 