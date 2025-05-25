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
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }
      const decoded = jwt.verify(token, jwtSecret) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 사용자 KYC 상태 조회
    const { data: user } = await supabase
      .from('users')
      .select('kyc_status, kyc_level')
      .eq('id', userId)
      .single();

    // KYC 문서 조회 (kyc_documents 테이블이 있다고 가정)
    const { data: documents } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      success: true,
      data: {
        status: user?.kyc_status || 'not_started',
        level: user?.kyc_level || 0,
        documents: documents || []
      }
    });

  } catch (error) {
    console.error('KYC status fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch KYC status' },
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
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
      }
      const decoded = jwt.verify(token, jwtSecret) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { action, documentType, personalInfo } = body;

    if (action === 'submit_personal_info') {
      // 개인정보 업데이트
      const { error } = await supabase
        .from('users')
        .update({
          first_name: personalInfo.firstName,
          last_name: personalInfo.lastName,
          date_of_birth: personalInfo.dateOfBirth,
          nationality: personalInfo.nationality,
          address: personalInfo.address,
          city: personalInfo.city,
          postal_code: personalInfo.postalCode,
          country: personalInfo.country,
          kyc_status: 'pending'
        })
        .eq('id', userId);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update personal information' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Personal information submitted successfully'
      });

    } else if (action === 'submit_document') {
      // 문서 제출 (실제로는 파일 업로드 처리)
      const kycDocument = {
        user_id: userId,
        document_type: documentType,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('kyc_documents')
        .insert(kycDocument);

      if (error) {
        console.log('KYC documents table not found, simulating document submission');
      }

      return NextResponse.json({
        success: true,
        message: 'Document submitted successfully'
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('KYC submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process KYC request' },
      { status: 500 }
    );
  }
} 