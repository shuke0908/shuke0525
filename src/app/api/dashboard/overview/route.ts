import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 ID 추출 (실제 구현에서는 JWT 검증 필요)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 대시보드 개요 데이터 (실제로는 데이터베이스에서 계산)
    const overviewData = {
      portfolioValue: "12,450.75",
      dailyVolume: "8,234.50",
      totalProfit: "+2,145.30",
      profitPercentage: "+15.2%",
      monthlyReturn: "+18.7%",
      totalTrades: 156,
      winRate: "68.2%",
      avgProfit: "13.75",
      bestPerformingAsset: "BTC/USD",
      worstPerformingAsset: "XRP/USD",
      riskScore: 6.5,
      diversificationScore: 8.2
    };

    return NextResponse.json({
      success: true,
      ...overviewData,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Dashboard overview fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard overview' },
      { status: 500 }
    );
  }
} 