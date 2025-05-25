import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getFlashTradeSettings } from '../../../admin/flash-trade-settings/route';

// 개발 환경용 사용자 데이터 (실제로는 데이터베이스에서 조회)
const developmentUsers = [
  {
    id: 'admin-1',
    email: 'admin@quanttrade.com',
    username: 'admin',
    role: 'superadmin' as const,
    balance: 10000,
    isActive: true,
  },
  {
    id: 'user-1',
    email: 'user@quanttrade.com',
    username: 'user',
    role: 'user' as const,
    balance: 1000,
    isActive: true,
  },
  {
    id: 'trader-1',
    email: 'trader@quanttrade.com',
    username: 'trader',
    role: 'admin' as const,
    balance: 5000,
    isActive: true,
  }
];

// 메모리 저장소 (실제로는 데이터베이스 사용)
let flashTrades: any[] = [];
let tradeIdCounter = 1;

// FlashTrade 생성 스키마
const createTradeSchema = z.object({
  amount: z.number().min(1).max(50000),
  direction: z.enum(['up', 'down']),
  duration: z.number().min(15).max(3600),
  symbol: z.string().optional().default('BTC/USDT')
});

export async function POST(request: NextRequest) {
  try {
    // 헤더에서 사용자 정보 추출 (미들웨어에서 설정)
    const userId = request.headers.get('x-user-id');
    const userEmail = request.headers.get('x-user-email');

    if (!userId || !userEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    // 사용자 조회
    const user = developmentUsers.find(u => u.id === userId);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      );
    }

    const body = await request.json();
    
    // 요청 데이터 검증
    const validationResult = createTradeSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          details: validationResult.error.errors,
          code: 'VALIDATION_ERROR'
        },
        { status: 400 }
      );
    }

    const { amount, direction, duration, symbol } = validationResult.data;

    // 관리자 설정 조회
    const settings = getFlashTradeSettings(userId);

    // 설정 기반 유효성 검사
    if (!settings.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'FlashTrade is currently disabled',
          code: 'SERVICE_DISABLED'
        },
        { status: 503 }
      );
    }

    if (amount < settings.minAmount || amount > settings.maxAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Amount must be between $${settings.minAmount} and $${settings.maxAmount}`,
          code: 'INVALID_AMOUNT'
        },
        { status: 400 }
      );
    }

    if (!settings.availableDurations.includes(duration)) {
      return NextResponse.json(
        {
          success: false,
          error: `Duration ${duration}s is not available`,
          code: 'INVALID_DURATION'
        },
        { status: 400 }
      );
    }

    // 잔액 확인
    if (user.balance < amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient balance',
          code: 'INSUFFICIENT_BALANCE'
        },
        { status: 400 }
      );
    }

    // 현재 가격 시뮬레이션
    const currentPrice = 50000 + Math.random() * 10000; // $50,000 ~ $60,000

    // 만료 시간 계산
    const expiresAt = new Date(Date.now() + duration * 1000);

    // 잠재 수익 계산
    const potentialProfit = amount * (settings.maxProfitRate / 100);

    // FlashTrade 생성
    const newTrade = {
      id: `trade-${tradeIdCounter++}`,
      userId: user.id,
      amount,
      direction,
      duration,
      symbol,
      entryPrice: currentPrice,
      currentPrice,
      exitPrice: null,
      status: 'active',
      result: null,
      profit: 0,
      potentialProfit,
      returnRate: settings.maxProfitRate,
      createdAt: new Date(),
      expiresAt,
      completedAt: null,
      // 관리자 설정 정보 포함
      winRate: settings.winRate,
      forceResult: settings.forceResult
    };

    flashTrades.push(newTrade);

    // 사용자 잔액 차감 (실제로는 데이터베이스 업데이트)
    user.balance -= amount;

    console.log(`✅ FlashTrade Created: ${newTrade.id} by ${user.email} - $${amount} ${direction} for ${duration}s`);

    return NextResponse.json(
      {
        success: true,
        message: 'Trade created successfully',
        trade: {
          id: newTrade.id,
          amount: newTrade.amount,
          direction: newTrade.direction,
          duration: newTrade.duration,
          symbol: newTrade.symbol,
          entryPrice: newTrade.entryPrice,
          potentialProfit: newTrade.potentialProfit,
          returnRate: newTrade.returnRate,
          expiresAt: newTrade.expiresAt,
          status: newTrade.status
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('FlashTrade creation error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}

// 거래 조회 함수 (다른 API에서 사용)
export function getFlashTrades(userId?: string) {
  if (userId) {
    return flashTrades.filter(trade => trade.userId === userId);
  }
  return flashTrades;
}

// 특정 거래 조회
export function getFlashTradeById(tradeId: string) {
  return flashTrades.find(trade => trade.id === tradeId);
}

// 거래 업데이트
export function updateFlashTrade(tradeId: string, updates: any) {
  const tradeIndex = flashTrades.findIndex(trade => trade.id === tradeId);
  if (tradeIndex >= 0) {
    flashTrades[tradeIndex] = { ...flashTrades[tradeIndex], ...updates };
    return flashTrades[tradeIndex];
  }
  return null;
}

// 사용자 잔액 업데이트
export function updateUserBalance(userId: string, amount: number) {
  const user = developmentUsers.find(u => u.id === userId);
  if (user) {
    user.balance += amount;
    return user.balance;
  }
  return null;
}

/**
 * OPTIONS 요청 처리 (CORS)
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 