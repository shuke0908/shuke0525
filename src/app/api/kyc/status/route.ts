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

    // 임시 KYC 상태 데이터
    const kycStatus = {
      status: 'pending', // not_started, pending, approved, rejected
      documents: [
        {
          id: 1,
          type: 'identity',
          status: 'approved',
          uploadedAt: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: 2,
          type: 'address',
          status: 'pending',
          uploadedAt: new Date(Date.now() - 3600000).toISOString(),
        }
      ]
    };

    return NextResponse.json({
      success: true,
      ...kycStatus
    });
  } catch (error) {
    console.error('KYC status fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KYC status' },
      { status: 500 }
    );
  }
} 