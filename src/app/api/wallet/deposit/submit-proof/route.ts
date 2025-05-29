import { NextRequest, NextResponse } from 'next/server';
import { verifyJWT } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, walletTransactions } from '@/../shared/schema';
import { eq } from 'drizzle-orm';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

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

    // FormData 파싱
    const formData = await request.formData();
    const coin = formData.get('coin') as string;
    const network = formData.get('network') as string;
    const amount = formData.get('amount') as string;
    const txHash = formData.get('txHash') as string;
    const screenshot = formData.get('screenshot') as File;
    const notes = formData.get('notes') as string;
    const depositAddress = formData.get('depositAddress') as string;

    if (!coin || !network || !txHash || !screenshot) {
      return NextResponse.json({ 
        error: 'Required fields missing: coin, network, txHash, screenshot' 
      }, { status: 400 });
    }

    // 사용자 정보 조회
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (user.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // 스크린샷 파일 저장
    let screenshotUrl = '';
    if (screenshot && screenshot.size > 0) {
      const bytes = await screenshot.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // 업로드 디렉토리 생성
      const uploadDir = join(process.cwd(), 'public', 'uploads', 'deposits');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (error) {
        // 디렉토리가 이미 존재하는 경우 무시
      }

      // 파일명 생성 (타임스탬프 + 원본 파일명)
      const timestamp = Date.now();
      const originalName = screenshot.name;
      const extension = originalName.split('.').pop();
      const filename = `${userId}_${timestamp}.${extension}`;
      const filepath = join(uploadDir, filename);

      await writeFile(filepath, buffer);
      screenshotUrl = `/uploads/deposits/${filename}`;
    }

    // 지갑 거래 내역에 입금 요청 저장
    const transactionData = {
      userId,
      type: 'deposit' as const,
      coin,
      network,
      amount: amount ? parseFloat(amount) : 0,
      address: depositAddress,
      txHash,
      screenshotUrl,
      status: 'pending' as const,
      createdAt: new Date(),
    };

    const [newTransaction] = await db.insert(walletTransactions).values(transactionData).returning();

    return NextResponse.json({
      success: true,
      data: {
        transactionId: newTransaction.id,
        status: 'pending',
        message: '입금 증빙이 성공적으로 제출되었습니다. 관리자 승인을 기다려주세요.'
      },
      message: 'Deposit proof submitted successfully'
    });

  } catch (error) {
    console.error('Submit deposit proof API error:', error);
    return NextResponse.json(
      { error: 'Failed to submit deposit proof' },
      { status: 500 }
    );
  }
} 