import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';

// 관리자 권한 확인
async function checkAdminPermission(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user || !['admin', 'superadmin'].includes(user.role)) {
    return null;
  }
  return user;
}

// 거래 설정 조회
export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdminPermission(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 전체 기본 설정 조회
    const { data: globalSettings } = await supabaseAdmin
      .from('admin_settings')
      .select('*')
      .is('user_id', null)
      .eq('is_active', true)
      .single();

    // 사용자별 개별 설정 조회
    const { data: userSettings } = await supabaseAdmin
      .from('admin_settings')
      .select(`
        *,
        users!inner(id, email, username, role)
      `)
      .not('user_id', 'is', null)
      .eq('is_active', true);

    // 모든 사용자 목록 조회
    const { data: allUsers } = await supabaseAdmin
      .from('users')
      .select('id, email, username, role, balance, is_active')
      .order('created_at', { ascending: false });

    const settings = {
      global: globalSettings || {
        win_rate: 50,
        max_profit_rate: 80,
        min_profit_rate: 70,
        force_result: null
      },
      users: userSettings || [],
      allUsers: allUsers || []
    };

    return NextResponse.json({
      success: true,
      settings
    });

  } catch (error) {
    console.error('Error fetching trading settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 거래 설정 업데이트
export async function PUT(request: NextRequest) {
  try {
    const admin = await checkAdminPermission(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { type, userId, settings } = await request.json();

    if (type === 'global') {
      // 전체 기본 설정 업데이트
      const { error } = await supabaseAdmin
        .from('admin_settings')
        .upsert({
          user_id: null,
          setting_type: 'global',
          win_rate: settings.winRate,
          max_profit_rate: settings.maxProfitRate,
          min_profit_rate: settings.minProfitRate,
          force_result: settings.forceResult || null,
          is_active: true
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error updating global settings:', error);
        return NextResponse.json(
          { error: 'Failed to update global settings' },
          { status: 500 }
        );
      }

    } else if (type === 'user' && userId) {
      // 사용자별 개별 설정 업데이트
      const { error } = await supabaseAdmin
        .from('admin_settings')
        .upsert({
          user_id: userId,
          setting_type: 'user_specific',
          win_rate: settings.winRate,
          max_profit_rate: settings.maxProfitRate,
          min_profit_rate: settings.minProfitRate,
          force_result: settings.forceResult || null,
          is_active: true
        }, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        });

      if (error) {
        console.error('Error updating user settings:', error);
        return NextResponse.json(
          { error: 'Failed to update user settings' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // 관리자 로그 기록
    await supabaseAdmin
      .from('admin_logs')
      .insert({
        admin_id: admin.id,
        action: `UPDATE_TRADING_SETTINGS_${type.toUpperCase()}`,
        target_user_id: userId || null,
        details: { settings, type },
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1'
      });

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Error updating trading settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 사용자별 설정 삭제 (기본값으로 되돌리기)
export async function DELETE(request: NextRequest) {
  try {
    const admin = await checkAdminPermission(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 사용자별 설정 비활성화
    const { error } = await supabaseAdmin
      .from('admin_settings')
      .update({ is_active: false })
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting user settings:', error);
      return NextResponse.json(
        { error: 'Failed to delete user settings' },
        { status: 500 }
      );
    }

    // 관리자 로그 기록
    await supabaseAdmin
      .from('admin_logs')
      .insert({
        admin_id: admin.id,
        action: 'DELETE_USER_TRADING_SETTINGS',
        target_user_id: userId,
        details: { action: 'reset_to_default' },
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   '127.0.0.1'
      });

    return NextResponse.json({
      success: true,
      message: 'User settings reset to default'
    });

  } catch (error) {
    console.error('Error deleting trading settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 실시간 거래 모니터링
export async function PATCH(request: NextRequest) {
  try {
    const admin = await checkAdminPermission(request);
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 활성 거래 조회
    const { data: activeTrades } = await supabaseAdmin
      .from('flash_trades')
      .select(`
        *,
        users!inner(email, username)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(100);

    // 최근 완료된 거래 조회
    const { data: recentTrades } = await supabaseAdmin
      .from('flash_trades')
      .select(`
        *,
        users!inner(email, username)
      `)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(50);

    // 거래 통계
    const { data: tradeStats } = await supabaseAdmin
      .from('flash_trades')
      .select('result, amount')
      .eq('status', 'completed')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const stats = {
      totalTrades: tradeStats?.length || 0,
      winTrades: tradeStats?.filter(t => t.result === 'win').length || 0,
      loseTrades: tradeStats?.filter(t => t.result === 'lose').length || 0,
      totalVolume: tradeStats?.reduce((sum, t) => sum + Number(t.amount), 0) || 0
    };

    return NextResponse.json({
      success: true,
      data: {
        activeTrades: activeTrades || [],
        recentTrades: recentTrades || [],
        stats
      }
    });

  } catch (error) {
    console.error('Error fetching trading monitor data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 