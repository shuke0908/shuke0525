import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileSidebar } from './MobileSidebar';

interface AdminLayoutWithSidebarProps {
  children: React.ReactNode;
}

/**
 * 관리자 전용 AdminLayoutWithSidebar 컴포넌트
 * - 전용 관리자 사이드바
 * - 관리자 헤더
 * - 메인 콘텐츠 영역
 */
export function AdminLayoutWithSidebar({ children }: AdminLayoutWithSidebarProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* 데스크톱 관리자 사이드바 */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <Sidebar variant="admin" />
      </div>

      {/* 모바일 관리자 사이드바 */}
      <MobileSidebar variant="admin" />

      {/* 메인 콘텐츠 */}
      <div className="lg:pl-64">
        <Header variant="admin" />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
} 