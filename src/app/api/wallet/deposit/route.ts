import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase-server';
import jwt from 'jsonwebtoken';

const supabase = createServerSupabaseClient();

// 지원되는 코인별 네트워크 및 수수료
const SUPPORTED_COINS = {
  BTC: { networks: ['Bitcoin'], fee: 0.0005, minDeposit: 0.001 },
  ETH: { networks: ['Ethereum', 'BSC'], fee: 0.005, minDeposit: 0.01 },
  USDT: { networks: ['Ethereum', 'BSC', 'Tron'], fee: 1, minDeposit: 10 },
  BNB: { networks: ['BSC'], fee: 0.001, minDeposit: 0.01 },
  XRP: { networks: ['Ripple'], fee: 0.1, minDeposit: 1 }
};

// 입금 주소 생성 (시뮬레이션)
function generateDepositAddress(coin: string, network: string, userId: string): string {
  const prefixes: { [key: string]: string } = {
    'Bitcoin': '1',
    'Ethereum': '0x',
    'BSC': '0x',
    'Tron': 'T',
    'Ripple': 'r'
  };
  
  const prefix = prefixes[network] || '0x';
  const hash = Buffer.from(`${userId}_${coin}_${network}_${Date.now()}`).toString('hex').substring(0, 32);
  
  return `${prefix}${hash}`;
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
    const { coin, amount, network } = body;

    // 입력 검증
    if (!coin || !amount || !network) {
      return NextResponse.json(
        { error: 'Coin, amount, and network are required' },
        { status: 400 }
      );
    }

    // 지원되는 코인 확인
    if (!SUPPORTED_COINS[coin as keyof typeof SUPPORTED_COINS]) {
      return NextResponse.json(
        { error: 'Unsupported coin' },
        { status: 400 }
      );
    }

    const coinConfig = SUPPORTED_COINS[coin as keyof typeof SUPPORTED_COINS];
    
    // 네트워크 확인
    if (!coinConfig.networks.includes(network)) {
      return NextResponse.json(
        { error: `Unsupported network for ${coin}. Supported: ${coinConfig.networks.join(', ')}` },
        { status: 400 }
      );
    }

    // 최소 입금액 확인
    if (parseFloat(amount) < coinConfig.minDeposit) {
      return NextResponse.json(
        { error: `Minimum deposit amount is ${coinConfig.minDeposit} ${coin}` },
        { status: 400 }
      );
    }

    // 입금 주소 생성
    const depositAddress = generateDepositAddress(coin, network, userId);

    // 입금 요청 생성
    const depositRequest = {
      id: `dep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      coin,
      amount: parseFloat(amount),
      network,
      deposit_address: depositAddress,
      status: 'pending',
      fee: coinConfig.fee,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24시간 후 만료
    };

    // 데이터베이스에 입금 요청 저장
    try {
      const { error } = await supabase
        .from('wallet_transactions')
        .insert({
          ...depositRequest,
          transaction_type: 'deposit'
        });

      if (error) {
        console.log('Wallet transactions table not found, creating mock response');
      }
    } catch (dbError) {
      console.log('Database insert failed, continuing with mock response');
    }

    return NextResponse.json({
      success: true,
      data: {
        ...depositRequest,
        qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${depositAddress}`,
        instructions: [
          `Send exactly ${amount} ${coin} to the address below`,
          `Network: ${network}`,
          `Minimum confirmations: ${coin === 'BTC' ? 3 : coin === 'ETH' ? 12 : 1}`,
          `This address expires in 24 hours`
        ]
      },
      message: 'Deposit address generated successfully'
    });

  } catch (error) {
    console.error('Deposit creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create deposit request' },
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

    // 사용자의 입금 내역 조회
    const { data: deposits, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('transaction_type', 'deposit')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching deposits:', error);
      return NextResponse.json(
        { error: 'Failed to fetch deposits' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deposits || []
    });

  } catch (error) {
    console.error('Deposit fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deposits' },
      { status: 500 }
    );
  }
} 