import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase-server';

const supabase = createServerSupabaseClient();

export async function GET(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 ID 추출 (실제 구현에서는 JWT 검증 필요)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // JWT 토큰에서 사용자 ID 추출 (간단한 구현)
    const token = authHeader.replace('Bearer ', '');
    let userId;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.userId;
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 실제 데이터베이스에서 사용자 데이터 조회
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 거래 내역 조회
    const { data: trades, error: tradesError } = await supabase
      .from('flash_trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 포지션 조회
    const { data: positions, error: positionsError } = await supabase
      .from('quick_trade_positions')
      .select('*')
      .eq('user_id', userId);

    // AI 투자 조회
    const { data: aiInvestments, error: aiError } = await supabase
      .from('quant_ai_investments')
      .select('*')
      .eq('user_id', userId);

    // 계산된 데이터
    const totalTrades = (trades?.length || 0) + (positions?.length || 0) + (aiInvestments?.length || 0);
    const winningTrades = trades?.filter(t => t.result === 'win').length || 0;
    const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : "0";
    
    const totalProfit = trades?.reduce((sum, trade) => sum + (parseFloat(trade.profit) || 0), 0) || 0;
    const portfolioValue = parseFloat(user.balance) + totalProfit;
    
    const overviewData = {
      portfolioValue: portfolioValue.toFixed(2),
      dailyVolume: "0.00", // 실제로는 일일 거래량 계산
      totalProfit: totalProfit >= 0 ? `+${totalProfit.toFixed(2)}` : totalProfit.toFixed(2),
      profitPercentage: totalProfit >= 0 ? `+${((totalProfit / parseFloat(user.balance)) * 100).toFixed(1)}%` : `${((totalProfit / parseFloat(user.balance)) * 100).toFixed(1)}%`,
      monthlyReturn: "+0.0%", // 실제로는 월간 수익률 계산
      totalTrades,
      winRate: `${winRate}%`,
      avgProfit: totalTrades > 0 ? (totalProfit / totalTrades).toFixed(2) : "0.00",
      bestPerformingAsset: "BTC/USD",
      worstPerformingAsset: "ETH/USD",
      riskScore: 5.0,
      diversificationScore: 7.0
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