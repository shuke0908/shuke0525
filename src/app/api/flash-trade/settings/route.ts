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

    // Flash Trade 설정 시뮬레이션 데이터
    const settings = [
      {
        id: '1',
        duration: 30,
        returnRate: 85,
        minAmount: 5,
        maxAmount: 1000,
        isActive: true,
        symbol: 'BTC/USDT'
      },
      {
        id: '2',
        duration: 60,
        returnRate: 80,
        minAmount: 10,
        maxAmount: 2000,
        isActive: true,
        symbol: 'BTC/USDT'
      },
      {
        id: '3',
        duration: 120,
        returnRate: 90,
        minAmount: 15,
        maxAmount: 3000,
        isActive: true,
        symbol: 'BTC/USDT'
      },
      {
        id: '4',
        duration: 180,
        returnRate: 95,
        minAmount: 20,
        maxAmount: 4000,
        isActive: true,
        symbol: 'BTC/USDT'
      },
      {
        id: '5',
        duration: 300,
        returnRate: 100,
        minAmount: 25,
        maxAmount: 5000,
        isActive: true,
        symbol: 'BTC/USDT'
      }
    ];

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Flash trade settings API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flash trade settings' },
      { status: 500 }
    );
  }
} 