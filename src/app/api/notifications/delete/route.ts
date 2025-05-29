import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { db } from '@/lib/db';
import { notifications } from '@/../shared/schema';
import { eq, and, inArray } from 'drizzle-orm';

export async function DELETE(request: NextRequest) {
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
    const { notificationIds } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ 
        error: 'Notification IDs are required' 
      }, { status: 400 });
    }

    // 실제 구현에서는 DB에서 삭제
    // const deletedNotifications = await db.delete(notifications)
    //   .where(
    //     and(
    //       eq(notifications.userId, userId),
    //       inArray(notifications.id, notificationIds)
    //     )
    //   )
    //   .returning();

    // 시뮬레이션: 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        deletedCount: notificationIds.length,
        notificationIds
      },
      message: 'Notifications deleted successfully'
    });

  } catch (error) {
    console.error('Delete notifications API error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
} 