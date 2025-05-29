import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileSidebar } from './MobileSidebar';

interface LayoutProps {
  children: React.ReactNode;
}

/**
 * 일반 사용자용 Layout 컴포넌트
 * - 사이드바 네비게이션
 * - 헤더
 * - 메인 콘텐츠 영역
 */
function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* 데스크톱 사이드바 */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <Sidebar variant="user" />
      </div>

      {/* 모바일 사이드바 */}
      <MobileSidebar variant="user" />

      {/* 메인 콘텐츠 */}
      <div className="lg:pl-64">
        <Header variant="user" />
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
