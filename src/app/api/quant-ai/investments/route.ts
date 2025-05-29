import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';

export async function GET(request: NextRequest) {
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

    // 시뮬레이션 데이터 (실제로는 DB에서 조회)
    const mockInvestments = [
      {
        id: 1,
        strategyId: 'balanced',
        strategyName: '균형 전략',
        amount: '1000.00',
        duration: 30,
        expectedReturn: '19.8',
        expectedProfit: '16.27',
        currentValue: '1045.32',
        currentProfit: '45.32',
        profitPercentage: '+4.53',
        riskLevel: 'medium',
        status: 'active',
        progress: 67, // 30일 중 20일 경과
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        strategyId: 'conservative',
        strategyName: '보수적 전략',
        amount: '500.00',
        duration: 14,
        expectedReturn: '12.3',
        expectedProfit: '2.30',
        currentValue: '502.15',
        currentProfit: '2.15',
        profitPercentage: '+0.43',
        riskLevel: 'low',
        status: 'active',
        progress: 86, // 14일 중 12일 경과
        startDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        strategyId: 'aggressive',
        strategyName: '공격적 전략',
        amount: '2000.00',
        duration: 60,
        expectedReturn: '34.7',
        expectedProfit: '113.97',
        currentValue: '1876.45',
        currentProfit: '-123.55',
        profitPercentage: '-6.18',
        riskLevel: 'high',
        status: 'completed',
        progress: 100,
        startDate: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 4,
        strategyId: 'balanced',
        strategyName: '균형 전략',
        amount: '750.00',
        duration: 30,
        expectedReturn: '19.8',
        expectedProfit: '12.20',
        currentValue: '798.67',
        currentProfit: '48.67',
        profitPercentage: '+6.49',
        riskLevel: 'medium',
        status: 'completed',
        progress: 100,
        startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // 활성 투자와 완료된 투자 분리
    const activeInvestments = mockInvestments.filter(inv => inv.status === 'active');
    const completedInvestments = mockInvestments.filter(inv => inv.status === 'completed');

    // 총 수익 계산
    const totalInvested = mockInvestments.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
    const totalCurrentValue = mockInvestments.reduce((sum, inv) => sum + parseFloat(inv.currentValue), 0);
    const totalProfit = totalCurrentValue - totalInvested;

    return NextResponse.json({
      success: true,
      data: {
        active: activeInvestments,
        completed: completedInvestments,
        summary: {
          totalInvestments: mockInvestments.length,
          activeInvestments: activeInvestments.length,
          totalInvested: totalInvested.toFixed(2),
          totalCurrentValue: totalCurrentValue.toFixed(2),
          totalProfit: totalProfit.toFixed(2),
          totalProfitPercentage: ((totalProfit / totalInvested) * 100).toFixed(2)
        }
      }
    });

  } catch (error) {
    console.error('Quant AI investments API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch investments' },
      { status: 500 }
    );
  }
} 