import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase-server';
import jwt from 'jsonwebtoken';

const supabase = createServerSupabaseClient();

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

    // 쿼리 파라미터 처리
    const url = new URL(request.url);
    const type = url.searchParams.get('type'); // 'deposit', 'withdrawal', 'all'
    const status = url.searchParams.get('status'); // 'pending', 'completed', 'failed'
    const coin = url.searchParams.get('coin');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // 모의 거래 내역 데이터
    const mockTransactions = [
      {
        id: `tx_${Date.now()}_1`,
        user_id: userId,
        transaction_type: 'deposit',
        coin: 'USDT',
        amount: 500.00,
        status: 'completed',
        deposit_address: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e416',
        network: 'Ethereum',
        fee: 5.00,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        completed_at: new Date(Date.now() - 86000000).toISOString(),
        tx_hash: '0x1234567890abcdef1234567890abcdef12345678'
      },
      {
        id: `tx_${Date.now()}_2`,
        user_id: userId,
        transaction_type: 'withdrawal',
        coin: 'BTC',
        amount: 0.01,
        status: 'pending',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        network: 'Bitcoin',
        fee: 0.0005,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        estimated_completion: new Date(Date.now() + 3600000).toISOString()
      },
      {
        id: `tx_${Date.now()}_3`,
        user_id: userId,
        transaction_type: 'deposit',
        coin: 'ETH',
        amount: 1.5,
        status: 'completed',
        deposit_address: '0x742d35Cc6634C0532925a3b8D4C0C8b3C2e1e416',
        network: 'Ethereum',
        fee: 0.005,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        completed_at: new Date(Date.now() - 172000000).toISOString(),
        tx_hash: '0xabcdef1234567890abcdef1234567890abcdef12'
      }
    ];

    // 필터 적용
    let filteredTransactions = mockTransactions;
    if (type && type !== 'all') {
      filteredTransactions = filteredTransactions.filter(tx => tx.transaction_type === type);
    }
    if (status) {
      filteredTransactions = filteredTransactions.filter(tx => tx.status === status);
    }
    if (coin) {
      filteredTransactions = filteredTransactions.filter(tx => tx.coin === coin.toUpperCase());
    }

    // 통계 계산
    const totalDeposits = filteredTransactions.filter(tx => tx.transaction_type === 'deposit' && tx.status === 'completed')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    const totalWithdrawals = filteredTransactions.filter(tx => tx.transaction_type === 'withdrawal' && tx.status === 'completed')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const pendingTransactions = filteredTransactions.filter(tx => tx.status === 'pending').length;

    return NextResponse.json({
      success: true,
      data: {
        transactions: filteredTransactions.slice(offset, offset + limit),
        statistics: {
          totalDeposits,
          totalWithdrawals,
          pendingTransactions,
          netFlow: totalDeposits - totalWithdrawals
        },
        pagination: {
          total: filteredTransactions.length,
          limit,
          offset,
          hasMore: offset + limit < filteredTransactions.length
        }
      }
    });

  } catch (error) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
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
    const { action, transactionId } = body;

    if (action === 'cancel' && transactionId) {
      // 거래 취소 시뮬레이션
      return NextResponse.json({
        success: true,
        message: 'Transaction cancelled successfully'
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Transaction action error:', error);
    return NextResponse.json(
      { error: 'Failed to process transaction action' },
      { status: 500 }
    );
  }
} 
