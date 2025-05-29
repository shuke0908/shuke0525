import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { users, walletTransactions } from '@/../shared/schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
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
    const { coin, network } = await request.json();

    if (!coin || !network) {
      return NextResponse.json({ 
        error: 'Coin and network are required' 
      }, { status: 400 });
    }

    // 사용자 정보 조회
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 시뮬레이션된 입금 주소 생성
    const generateAddress = (coin: string, network: string) => {
      const addresses = {
        'BTC-BTC': '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        'ETH-ERC20': '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
        'USDT-ERC20': '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
        'USDT-TRC20': 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
        'BNB-BSC': '0x742d35Cc6634C0532925a3b8D4C9db96590b4c5d',
      };
      
      const key = `${coin}-${network}`;
      return addresses[key as keyof typeof addresses] || 
             `${coin.toLowerCase()}_${network.toLowerCase()}_${Date.now()}`;
    };

    const depositAddress = generateAddress(coin, network);
    
    // QR 코드 생성 (실제로는 QR 코드 생성 라이브러리 사용)
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${depositAddress}`;

    // 메모가 필요한 코인들 (XRP, XLM 등)
    const needsMemo = ['XRP', 'XLM', 'EOS'];
    const memo = needsMemo.includes(coin) ? Math.floor(Math.random() * 1000000).toString() : undefined;

    // 만료 시간 (24시간 후)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const depositData = {
      address: depositAddress,
      qrCode: qrCodeUrl,
      memo,
      expiresAt,
      coin,
      network,
      userId
    };

    return NextResponse.json({
      success: true,
      data: depositData,
      message: 'Deposit address generated successfully'
    });

  } catch (error) {
    console.error('Generate deposit address API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate deposit address' },
      { status: 500 }
    );
  }
} 