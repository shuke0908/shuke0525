import React, { ReactNode, useState } from "react";
import { Helmet } from "react-helmet";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileSidebar } from "./MobileSidebar";
import { useAuth } from "@/components/auth/AuthProvider";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showHeader?: boolean;
  variant?: "user" | "admin";
  className?: string;
}

/**
 * 통합 애플리케이션 레이아웃 컴포넌트
 * - 왼쪽 고정 사이드바 (데스크톱/태블릿)
 * - 선택적 상단 헤더
 * - 메인 콘텐츠 영역
 * - 모바일 반응형 처리
 */
export function AppLayout({ 
  children, 
  title, 
  description, 
  showHeader = true,
  variant = "user",
  className 
}: AppLayoutProps) {
  const { user } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const pageTitle = title ? `${title} | CryptoTrader` : "CryptoTrader";
  
  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        {description && <meta name="description" content={description} />}
      </Helmet>
      
      <div className="flex h-screen bg-background text-foreground">
        {/* 데스크톱/태블릿 사이드바 - 768px 이상에서 표시 */}
        <div className="hidden md:flex">
          <Sidebar 
            variant={variant}
            className="w-64 h-screen sticky top-0"
          />
        </div>
        
        {/* 모바일 사이드바 - 768px 미만에서 오버레이로 표시 */}
        <MobileSidebar
          variant={variant}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
        />
        
        {/* 메인 콘텐츠 영역 */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* 상단 헤더 (선택적) */}
          {showHeader && (
            <Header 
              onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
              variant={variant}
              className="sticky top-0 z-40"
            />
          )}
          
          {/* 메인 콘텐츠 */}
          <main className={cn(
            "flex-1 overflow-y-auto",
            "p-4 md:p-6 lg:p-8",
            className
          )}>
            {/* 페이지 제목 영역 */}
            {title && (
              <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
                {description && (
                  <p className="text-muted-foreground text-sm md:text-base">
                    {description}
                  </p>
                )}
              </div>
            )}
            
            {/* 페이지 콘텐츠 */}
            <div className="w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
} 