import React from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: "user" | "admin";
  className?: string;
}

/**
 * 모바일 사이드바 컴포넌트
 * - 768px 미만에서 오버레이로 표시
 * - Sheet 컴포넌트를 사용한 슬라이드 인 애니메이션
 * - 외부 클릭 시 자동 닫힘
 */
export function MobileSidebar({ 
  isOpen, 
  onClose, 
  variant = "user", 
  className 
}: MobileSidebarProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="left" 
        className={cn("p-0 w-64", className)}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>
            {variant === "admin" ? "관리자 메뉴" : "메인 메뉴"}
          </SheetTitle>
        </SheetHeader>
        
        {/* 사이드바 컴포넌트 재사용 */}
        <Sidebar 
          variant={variant} 
          className="w-full h-full border-r-0"
        />
      </SheetContent>
    </Sheet>
  );
} 