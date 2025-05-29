import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, isSupabaseConfigured } from '@/lib/supabase-server';

const supabase = createServerSupabaseClient();

export async function POST(request: NextRequest) {
  try {
    // JWT 토큰에서 사용자 ID 추출 (실제 구현에서는 JWT 검증 필요)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    if (!file || !type) {
      return NextResponse.json(
        { error: 'File and type are required' },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // 파일 타입 검증
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, and PDF files are allowed' },
        { status: 400 }
      );
    }

    // 실제로는 파일을 스토리지에 업로드하고 데이터베이스에 기록
    const uploadResult = {
      id: Date.now().toString(),
      type,
      status: 'pending',
      uploadedAt: new Date().toISOString(),
      filename: file.name,
      size: file.size
    };

    return NextResponse.json({
      success: true,
      data: uploadResult,
      message: 'Document uploaded successfully'
    });
  } catch (error) {
    console.error('KYC upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
} 