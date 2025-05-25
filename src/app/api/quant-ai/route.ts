import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 관리자 설정 기반 AI 투자 결과 계산 함수
async function calculateQuantAIResult(userId: string, amount: number, strategy: string) {
  try {
    // 사용자별 관리자 설정 조회
    const { data: settings } = await supabase
      .from('admin_settings')
      .select('*')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .eq('is_active', true)
      .order('user_id', { nullsFirst: false })
      .limit(1)
      .single();

    const winRate = settings?.win_rate || 50.00;
    const maxProfitRate = settings?.max_profit_rate || 80.00;
    const minProfitRate = settings?.min_profit_rate || 70.00;
    const forceResult = settings?.force_result;

    // AI 전략별 승률 조정
    let adjustedWinRate = winRate;
    switch (strategy) {
      case 'conservative':
        adjustedWinRate = Math.min(winRate + 10, 95); // 보수적 전략은 승률 +10%
        break;
      case 'aggressive':
        adjustedWinRate = Math.max(winRate - 5, 20); // 공격적 전략은 승률 -5%
        break;
      case 'balanced':
      default:
        adjustedWinRate = winRate; // 균형 전략은 기본 승률
        break;
    }

    // 결과 결정
    let result: 'win' | 'lose';
    if (forceResult) {
      result = forceResult as 'win' | 'lose';
    } else {
      const random = Math.random() * 100;
      result = random <= adjustedWinRate ? 'win' : 'lose';
    }

    // 수익 계산 (AI는 일반적으로 더 안정적인 수익률)
    let profit: number;
    if (result === 'win') {
      const profitRate = minProfitRate + Math.random() * (maxProfitRate - minProfitRate);
      // AI 투자는 보통 더 보수적인 수익률
      const aiProfitRate = Math.min(profitRate * 0.8, 50); // 최대 50% 수익률로 제한
      profit = amount * (aiProfitRate / 100);
    } else {
      // AI 투자는 손실도 제한적
      const lossRate = Math.min(Math.random() * 30 + 10, 40); // 10-40% 손실
      profit = -amount * (lossRate / 100);
    }

    return {
      result,
      profit,
      strategy,
      adjustedWinRate
    };
  } catch (error) {
    console.error('Error calculating AI result:', error);
    return {
      result: Math.random() > 0.6 ? 'win' : 'lose' as 'win' | 'lose',
      profit: Math.random() > 0.6 ? amount * 0.15 : -amount * 0.1,
      strategy,
      adjustedWinRate: 60
    };
  }
}

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰 검증
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { action, amount, strategy, riskLevel, duration } = body;

    if (action === 'start') {
      // AI 투자 시작
      if (!amount || amount <= 0) {
        return NextResponse.json(
          { error: 'Valid investment amount is required' },
          { status: 400 }
        );
      }

      // 사용자 잔액 확인
      const { data: user } = await supabase
        .from('users')
        .select('balance')
        .eq('id', userId)
        .single();

      if (!user || user.balance < amount) {
        return NextResponse.json(
          { error: 'Insufficient balance' },
          { status: 400 }
        );
      }

      // AI 투자 결과 계산
      const aiResult = await calculateQuantAIResult(userId, amount, strategy || 'balanced');

      // AI 투자 데이터 생성
      const quantAI = {
        id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        user_id: userId,
        amount: parseFloat(amount),
        strategy: strategy || 'balanced',
        risk_level: riskLevel || 'medium',
        duration: duration || 24, // 기본 24시간
        result: aiResult.result,
        profit: aiResult.profit,
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      };

      // 사용자 잔액 업데이트
      const newBalance = user.balance + aiResult.profit;
      await supabase
        .from('users')
        .update({ balance: newBalance })
        .eq('id', userId);

      // 거래 내역에 기록
      await supabase
        .from('trade_history')
        .insert({
          user_id: userId,
          trade_type: 'quant_ai',
          trade_id: quantAI.id,
          amount: quantAI.amount,
          result: aiResult.result,
          profit: aiResult.profit,
          balance_before: user.balance,
          balance_after: newBalance
        });

      return NextResponse.json({
        success: true,
        data: {
          ...quantAI,
          balance_before: user.balance,
          balance_after: newBalance,
          win_rate: aiResult.adjustedWinRate
        },
        message: `AI Investment ${aiResult.result === 'win' ? 'successful' : 'completed'}! ${aiResult.result === 'win' ? 'Profit' : 'Loss'}: $${Math.abs(aiResult.profit).toFixed(2)}`
      });

    } else if (action === 'status') {
      // AI 투자 상태 조회
      const { data: aiInvestments } = await supabase
        .from('trade_history')
        .select('*')
        .eq('user_id', userId)
        .eq('trade_type', 'quant_ai')
        .order('created_at', { ascending: false })
        .limit(10);

      return NextResponse.json({
        success: true,
        data: {
          isActive: false, // 실제로는 활성 투자 여부 확인
          investments: aiInvestments || [],
          totalProfit: aiInvestments?.reduce((sum, inv) => sum + (inv.profit || 0), 0) || 0,
          winRate: aiInvestments?.length > 0 
            ? (aiInvestments.filter(inv => inv.result === 'win').length / aiInvestments.length) * 100 
            : 0
        }
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Quant AI error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // JWT 토큰 검증
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let userId: string;
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 사용자의 AI 투자 내역 조회
    const { data: investments, error } = await supabase
      .from('trade_history')
      .select('*')
      .eq('user_id', userId)
      .eq('trade_type', 'quant_ai')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching AI investments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch investments' },
        { status: 500 }
      );
    }

    // 성과 통계 계산
    const totalInvestments = investments?.length || 0;
    const winCount = investments?.filter(inv => inv.result === 'win').length || 0;
    const totalProfit = investments?.reduce((sum, inv) => sum + (inv.profit || 0), 0) || 0;
    const winRate = totalInvestments > 0 ? (winCount / totalInvestments) * 100 : 0;

    return NextResponse.json({
      success: true,
      data: {
        investments: investments || [],
        statistics: {
          totalInvestments,
          winCount,
          lossCount: totalInvestments - winCount,
          totalProfit,
          winRate: winRate.toFixed(1),
          averageProfit: totalInvestments > 0 ? (totalProfit / totalInvestments).toFixed(2) : '0.00'
        }
      }
    });

  } catch (error) {
    console.error('Quant AI fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI data' },
      { status: 500 }
    );
  }
} 