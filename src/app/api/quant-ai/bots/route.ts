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

    // 사용자의 AI 봇 목록
    const bots = [
      {
        id: '1',
        name: 'Conservative Bot',
        strategy: 'conservative',
        status: 'active',
        assets: ['BTC/USD', 'ETH/USD'],
        riskLevel: 'low',
        allocation: 1000,
        performance: {
          totalReturn: 15.5,
          winRate: 68.2,
          sharpeRatio: 1.45,
          maxDrawdown: -5.2
        },
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7일 전
      },
      {
        id: '2',
        name: 'Aggressive Bot',
        strategy: 'aggressive',
        status: 'paused',
        assets: ['BTC/USD', 'ETH/USD', 'XRP/USD'],
        riskLevel: 'high',
        allocation: 500,
        performance: {
          totalReturn: 28.7,
          winRate: 55.8,
          sharpeRatio: 1.12,
          maxDrawdown: -12.8
        },
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14일 전
      }
    ];

    return NextResponse.json({
      success: true,
      bots
    });
  } catch (error) {
    console.error('AI bots fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI bots' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 ID 추출 (실제 구현에서는 JWT 검증 필요)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, strategy, assets, riskLevel, allocation } = body;

    if (!name || !strategy || !assets || !riskLevel || !allocation) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // 새 AI 봇 생성 (실제로는 데이터베이스에 저장)
    const newBot = {
      id: Date.now().toString(),
      name,
      strategy,
      assets,
      riskLevel,
      allocation: parseFloat(allocation),
      status: 'inactive',
      performance: {
        totalReturn: 0,
        winRate: 0,
        sharpeRatio: 0,
        maxDrawdown: 0
      },
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: newBot,
      message: 'AI bot created successfully'
    });
  } catch (error) {
    console.error('AI bot creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create AI bot' },
      { status: 500 }
    );
  }
} 