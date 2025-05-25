import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Supabase에서 최신 잔액 조회
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      balance: userData.balance
    });
  } catch (error) {
    console.error('Balance fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, type } = await request.json();

    if (!amount || !type || !['deposit', 'withdraw'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid amount or type' },
        { status: 400 }
      );
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    // 현재 잔액 조회
    const { data: currentUser, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('balance')
      .eq('id', user.id)
      .single();

    if (fetchError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentBalance = parseFloat(currentUser.balance);

    // 출금 시 잔액 확인
    if (type === 'withdraw' && currentBalance < numAmount) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // 새 잔액 계산
    const newBalance = type === 'deposit' 
      ? currentBalance + numAmount 
      : currentBalance - numAmount;

    // 잔액 업데이트
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('balance')
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update balance' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      balance: updatedUser.balance,
      message: `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful`
    });
  } catch (error) {
    console.error('Balance update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 