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
    const { strategyId, amount, duration } = await request.json();

    // 입력 검증
    if (!strategyId || !amount || !duration) {
      return NextResponse.json({ 
        error: 'Strategy ID, amount, and duration are required' 
      }, { status: 400 });
    }

    if (!['conservative', 'balanced', 'aggressive'].includes(strategyId)) {
      return NextResponse.json({ 
        error: 'Invalid strategy ID' 
      }, { status: 400 });
    }

    if (amount < 100 || amount > 50000) {
      return NextResponse.json({ 
        error: 'Amount must be between $100 and $50,000' 
      }, { status: 400 });
    }

    if (![7, 14, 30, 60, 90].includes(duration)) {
      return NextResponse.json({ 
        error: 'Duration must be 7, 14, 30, 60, or 90 days' 
      }, { status: 400 });
    }

    // 전략별 설정
    const strategySettings = {
      conservative: {
        name: '보수적 전략',
        expectedReturn: 12.3,
        riskLevel: 'low',
        maxDrawdown: 5.2
      },
      balanced: {
        name: '균형 전략',
        expectedReturn: 19.8,
        riskLevel: 'medium',
        maxDrawdown: 12.1
      },
      aggressive: {
        name: '공격적 전략',
        expectedReturn: 34.7,
        riskLevel: 'high',
        maxDrawdown: 28.5
      }
    };

    const strategy = strategySettings[strategyId as keyof typeof strategySettings];
    
    // 예상 수익 계산 (연간 수익률을 일일로 환산)
    const dailyReturn = strategy.expectedReturn / 365;
    const expectedProfit = (amount * dailyReturn * duration / 100).toFixed(2);

    // 새 투자 생성 (시뮬레이션)
    const newInvestment = {
      id: Date.now(),
      userId,
      strategyId,
      strategyName: strategy.name,
      amount: amount.toString(),
      duration,
      expectedReturn: strategy.expectedReturn.toString(),
      expectedProfit,
      currentValue: amount.toString(),
      currentProfit: '0.00',
      riskLevel: strategy.riskLevel,
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };

    // 실제 구현에서는 DB에 저장하고 AI 엔진 시작
    // await db.insert(quantInvestments).values(newInvestment);

    return NextResponse.json({
      success: true,
      data: newInvestment,
      message: 'AI investment started successfully'
    });

  } catch (error) {
    console.error('Quant AI invest API error:', error);
    return NextResponse.json(
      { error: 'Failed to start AI investment' },
      { status: 500 }
    );
  }
} 