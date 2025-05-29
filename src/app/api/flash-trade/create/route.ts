import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰 검증
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyJWT(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = payload.userId;
    const { symbol, amount, direction, duration } = await request.json();

    // 입력 검증
    if (!symbol || !amount || !direction || !duration) {
      return NextResponse.json({ 
        error: 'Symbol, amount, direction, and duration are required' 
      }, { status: 400 });
    }

    if (!['up', 'down'].includes(direction)) {
      return NextResponse.json({ 
        error: 'Direction must be "up" or "down"' 
      }, { status: 400 });
    }

    if (amount < 1 || amount > 10000) {
      return NextResponse.json({ 
        error: 'Amount must be between $1 and $10,000' 
      }, { status: 400 });
    }

    if (![30, 60, 120, 180, 300].includes(duration)) {
      return NextResponse.json({ 
        error: 'Duration must be 30, 60, 120, 180, or 300 seconds' 
      }, { status: 400 });
    }

    // 수익률 계산 (시뮬레이션)
    const returnRates = {
      30: 75,   // 30초: 75%
      60: 85,   // 1분: 85%
      120: 90,  // 2분: 90%
      180: 95,  // 3분: 95%
      300: 100  // 5분: 100%
    };

    const returnRate = returnRates[duration as keyof typeof returnRates];
    const potentialProfit = (amount * returnRate / 100).toFixed(2);

    // 현재 가격 시뮬레이션
    const mockPrices: { [key: string]: number } = {
      'BTC/USDT': 41255.78,
      'ETH/USDT': 2456.32,
      'BNB/USDT': 312.45,
      'XRP/USDT': 0.6234,
      'SOL/USDT': 98.76,
      'ADA/USDT': 0.4567,
      'AVAX/USDT': 36.89,
      'EUR/USD': 1.0842,
      'GBP/USD': 1.2654,
      'USD/JPY': 149.23,
      'XAU/USD': 1875.23,
      'XAG/USD': 23.45
    };

    const entryPrice = mockPrices[symbol] || 1.0000;

    // 새 거래 생성 (시뮬레이션)
    const newTrade = {
      id: Date.now(),
      userId,
      symbol,
      amount: amount.toString(),
      direction,
      duration,
      returnRate: returnRate.toString(),
      entryPrice: entryPrice.toString(),
      potentialProfit,
      status: 'active',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + duration * 1000).toISOString()
    };

    // 실제 구현에서는 DB에 저장하고 스케줄러로 결과 처리
    // await db.insert(flashTrades).values(newTrade);

    return NextResponse.json({
      success: true,
      data: newTrade,
      message: 'Flash trade created successfully'
    });

  } catch (error) {
    console.error('Create flash trade API error:', error);
    return NextResponse.json(
      { error: 'Failed to create flash trade' },
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