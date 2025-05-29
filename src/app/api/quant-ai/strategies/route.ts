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

    // AI 전략 시뮬레이션 데이터
    const strategies = [
      {
        id: 'conservative',
        name: '보수적 전략',
        description: '안정적인 수익을 추구하는 저위험 전략',
        riskLevel: 'low',
        expectedReturn: '8-15%',
        minInvestment: 100,
        maxInvestment: 10000,
        features: [
          '낮은 변동성',
          '안정적인 수익',
          '자동 손절매',
          '분산 투자'
        ],
        performance: {
          winRate: '78%',
          avgReturn: '12.3%',
          maxDrawdown: '5.2%',
          sharpeRatio: '1.45'
        },
        isActive: true
      },
      {
        id: 'balanced',
        name: '균형 전략',
        description: '위험과 수익의 균형을 맞춘 중간 위험 전략',
        riskLevel: 'medium',
        expectedReturn: '15-25%',
        minInvestment: 200,
        maxInvestment: 25000,
        features: [
          '균형잡힌 포트폴리오',
          '적응형 알고리즘',
          '시장 상황 분석',
          '동적 리밸런싱'
        ],
        performance: {
          winRate: '72%',
          avgReturn: '19.8%',
          maxDrawdown: '12.1%',
          sharpeRatio: '1.28'
        },
        isActive: true
      },
      {
        id: 'aggressive',
        name: '공격적 전략',
        description: '높은 수익을 추구하는 고위험 고수익 전략',
        riskLevel: 'high',
        expectedReturn: '25-50%',
        minInvestment: 500,
        maxInvestment: 50000,
        features: [
          '고수익 추구',
          '레버리지 활용',
          '트렌드 추종',
          '모멘텀 거래'
        ],
        performance: {
          winRate: '65%',
          avgReturn: '34.7%',
          maxDrawdown: '28.5%',
          sharpeRatio: '1.12'
        },
        isActive: true
      }
    ];

    return NextResponse.json({
      success: true,
      data: strategies
    });

  } catch (error) {
    console.error('Quant AI strategies API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch strategies' },
      { status: 500 }
    );
  }
} 