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

    // 사용 가능한 보너스 목록
    const bonuses = [
      {
        id: 1,
        title: 'Welcome Bonus',
        description: 'Get 100% bonus on your first deposit',
        amount: '100%',
        type: 'deposit',
        minDeposit: '50',
        maxBonus: '1000',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
        isActive: true
      },
      {
        id: 2,
        title: 'Trading Bonus',
        description: 'Complete 10 trades and get $50 bonus',
        amount: '$50',
        type: 'trading',
        requirement: '10 trades',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후
        isActive: true
      },
      {
        id: 3,
        title: 'Referral Bonus',
        description: 'Invite friends and earn 20% commission',
        amount: '20%',
        type: 'referral',
        commission: '20%',
        isActive: true
      }
    ];

    return NextResponse.json({
      success: true,
      bonuses
    });
  } catch (error) {
    console.error('Available bonuses fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available bonuses' },
      { status: 500 }
    );
  }
} 