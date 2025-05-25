import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 ID 추출 (실제 구현에서는 JWT 검증 필요)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bonusId } = body;

    if (!bonusId) {
      return NextResponse.json(
        { error: 'Bonus ID is required' },
        { status: 400 }
      );
    }

    // 보너스 클레임 처리 (실제로는 데이터베이스에서 검증 후 처리)
    const claimedBonus = {
      id: Date.now().toString(),
      bonusId,
      amount: '100.00',
      status: 'claimed',
      claimedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30일 후
    };

    return NextResponse.json({
      success: true,
      data: claimedBonus,
      message: 'Bonus claimed successfully'
    });
  } catch (error) {
    console.error('Bonus claim error:', error);
    return NextResponse.json(
      { error: 'Failed to claim bonus' },
      { status: 500 }
    );
  }
} 