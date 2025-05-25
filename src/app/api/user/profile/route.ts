import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedUser } from '@/lib/auth';
import { createSuccessResponse, createAuthErrorResponse, createErrorResponse } from '@/lib/api-response';
import { createOptionsResponse } from '@/lib/cors';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Supabase에서 최신 사용자 정보 조회
    const { data: userData, error } = await supabaseAdmin
      .from('users')
      .select('id, email, username, role, balance, is_active, created_at')
      .eq('id', user.id)
      .single();

    if (error || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: userData
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { username } = await request.json();

    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    // 사용자명 중복 확인 (자신 제외)
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('username', username.trim())
      .neq('id', user.id)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'Username already exists' },
        { status: 400 }
      );
    }

    // 사용자명 업데이트
    const { data: updatedUser, error } = await supabaseAdmin
      .from('users')
      .update({ 
        username: username.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select('id, email, username, role, balance, is_active, created_at')
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return createOptionsResponse();
} 