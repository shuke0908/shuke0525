'use client';

import React from 'react';
import Layout from '@/components/layout/Layout';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * 대시보드 레이아웃
 * - 모든 대시보드 페이지에 공통으로 적용
 * - 사이드바와 헤더를 포함
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Layout>
      {children}
    </Layout>
  );
} 