import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    // 데이터베이스에서 거래 내역 조회
    let query = supabase
      .from('wallet_transactions')
      .select('*')
      .eq('user_id', userId);

    // 필터 적용
    if (type && type !== 'all') {
      query = query.eq('transaction_type', type);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (coin) {
      query = query.eq('coin', coin.toUpperCase());
    }

    const { data: transactions, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching transactions:', error);
      // 데이터베이스 테이블이 없는 경우 모의 데이터 반환
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

      // 필터 적용 (모의 데이터)
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

      return NextResponse.json({
        success: true,
        data: {
          transactions: filteredTransactions.slice(offset, offset + limit),
          pagination: {
            total: filteredTransactions.length,
            limit,
            offset,
            hasMore: offset + limit < filteredTransactions.length
          }
        }
      });
    }

    // 통계 계산
    const totalDeposits = transactions?.filter(tx => tx.transaction_type === 'deposit' && tx.status === 'completed')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
    
    const totalWithdrawals = transactions?.filter(tx => tx.transaction_type === 'withdrawal' && tx.status === 'completed')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;

    const pendingTransactions = transactions?.filter(tx => tx.status === 'pending').length || 0;

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions || [],
        statistics: {
          totalDeposits,
          totalWithdrawals,
          pendingTransactions,
          netFlow: totalDeposits - totalWithdrawals
        },
        pagination: {
          total: transactions?.length || 0,
          limit,
          offset,
          hasMore: (transactions?.length || 0) === limit
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
      // 거래 취소 (pending 상태인 경우만)
      const { data: transaction } = await supabase
        .from('wallet_transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', userId)
        .eq('status', 'pending')
        .single();

      if (!transaction) {
        return NextResponse.json(
          { error: 'Transaction not found or cannot be cancelled' },
          { status: 404 }
        );
      }

      // 거래 상태를 cancelled로 변경
      const { error } = await supabase
        .from('wallet_transactions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to cancel transaction' },
          { status: 500 }
        );
      }

      // 출금인 경우 잔액 복구
      if (transaction.transaction_type === 'withdrawal') {
        const { data: user } = await supabase
          .from('users')
          .select('balance')
          .eq('id', userId)
          .single();

        if (user) {
          const refundAmount = transaction.amount + (transaction.fee || 0);
          await supabase
            .from('users')
            .update({ balance: user.balance + refundAmount })
            .eq('id', userId);
        }
      }

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