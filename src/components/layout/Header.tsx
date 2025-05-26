import React from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MenuIcon,
  SearchIcon,
  BellIcon,
  GlobeIcon,
  UserIcon,
  SettingsIcon,
  LogOutIcon,
  HomeIcon,
} from "lucide-react";

interface HeaderProps {
  onMobileMenuToggle?: () => void;
  variant?: "user" | "admin";
  className?: string;
}

/**
 * 상단 헤더 컴포넌트
 * - 모바일 햄버거 메뉴 버튼
 * - 전역 검색 (선택적)
 * - 알림 센터
 * - 언어 선택
 * - 사용자 메뉴
 */
export function Header({ 
  onMobileMenuToggle, 
  variant = "user", 
  className 
}: HeaderProps) {
  const { user, logout } = useAuth();

  const displayName = user?.firstName || user?.email?.split('@')[0] || "사용자";
  const isAdmin = variant === "admin";

  // 알림 개수 (실제로는 API에서 가져와야 함)
  const notificationCount = 3;

  return (
    <header className={cn(
      "h-16 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      "border-b border-border",
      "flex items-center justify-between px-4 md:px-6",
      className
    )}>
      {/* 왼쪽 영역 */}
      <div className="flex items-center gap-4">
        {/* 모바일 햄버거 메뉴 버튼 */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMobileMenuToggle}
        >
          <MenuIcon className="h-5 w-5" />
          <span className="sr-only">메뉴 열기</span>
        </Button>

        {/* 브랜딩 (모바일에서만 표시) */}
        <Link href={isAdmin ? "/admin" : "/dashboard"} className="md:hidden">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">CT</span>
            </div>
            <span className="font-bold text-lg">CryptoTrader</span>
          </div>
        </Link>
      </div>

      {/* 중앙 영역 - 전역 검색 (데스크톱에서만) */}
      <div className="hidden lg:flex flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="검색..."
            className="pl-10 pr-4"
          />
        </div>
      </div>

      {/* 오른쪽 영역 */}
      <div className="flex items-center gap-2">
        {/* 검색 버튼 (모바일) */}
        <Button variant="ghost" size="icon" className="lg:hidden">
          <SearchIcon className="h-5 w-5" />
          <span className="sr-only">검색</span>
        </Button>

        {/* 알림 센터 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <BellIcon className="h-5 w-5" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </Badge>
              )}
              <span className="sr-only">알림</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>알림</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-64 overflow-y-auto">
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">새로운 거래 완료</p>
                  <p className="text-xs text-muted-foreground">
                    BTC/USDT 거래가 성공적으로 완료되었습니다.
                  </p>
                  <p className="text-xs text-muted-foreground">2분 전</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">KYC 인증 승인</p>
                  <p className="text-xs text-muted-foreground">
                    신원 인증이 승인되었습니다.
                  </p>
                  <p className="text-xs text-muted-foreground">1시간 전</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">입금 확인</p>
                  <p className="text-xs text-muted-foreground">
                    $1,000 입금이 확인되었습니다.
                  </p>
                  <p className="text-xs text-muted-foreground">3시간 전</p>
                </div>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center">
              <Link href="/notifications" className="w-full">
                모든 알림 보기
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 언어 선택 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <GlobeIcon className="h-5 w-5" />
              <span className="sr-only">언어 선택</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>언어 선택</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <span>한국어</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>English</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>日本語</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <span>中文</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 관리자 메뉴 (관리자인 경우) */}
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="hidden md:flex">
                관리자 메뉴
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>관리자 패널</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/admin">
                <DropdownMenuItem>
                  <HomeIcon className="mr-2 h-4 w-4" />
                  <span>대시보드</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/admin/users">
                <DropdownMenuItem>
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>사용자 관리</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/admin/settings">
                <DropdownMenuItem>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>시스템 설정</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* 사용자 메뉴 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 hidden md:flex">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback className="text-xs">
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{displayName}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>내 계정</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href="/settings">
              <DropdownMenuItem>
                <SettingsIcon className="mr-2 h-4 w-4" />
                <span>설정</span>
              </DropdownMenuItem>
            </Link>
            {isAdmin && (
              <Link href="/dashboard">
                <DropdownMenuItem>
                  <HomeIcon className="mr-2 h-4 w-4" />
                  <span>사용자 모드로 전환</span>
                </DropdownMenuItem>
              </Link>
            )}
            {!isAdmin && user?.role === 'admin' && (
              <Link href="/admin">
                <DropdownMenuItem>
                  <SettingsIcon className="mr-2 h-4 w-4" />
                  <span>관리자 모드로 전환</span>
                </DropdownMenuItem>
              </Link>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOutIcon className="mr-2 h-4 w-4" />
              <span>로그아웃</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 모바일 사용자 아바타 */}
        <Button variant="ghost" size="icon" className="md:hidden">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="text-xs">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </div>
    </header>
  );
}
