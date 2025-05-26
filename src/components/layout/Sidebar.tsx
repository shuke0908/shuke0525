import React from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  // 공통 아이콘
  HomeIcon,
  ShieldIcon,
  LogOutIcon,
  SettingsIcon,
  ChevronDownIcon,
  // 사용자 메뉴 아이콘
  TrendingUpIcon,
  ZapIcon,
  CpuIcon,
  WalletIcon,
  ShieldCheckIcon,
  BellIcon,
  MessageSquareIcon,
  // 관리자 메뉴 아이콘
  LayoutDashboardIcon,
  UsersIcon,
  TimerIcon,
  BarChart3Icon,
  ArrowDownToLineIcon,
  ArrowUpFromLineIcon,
  UserCogIcon,
  ActivityIcon,
  BarChart4Icon,
  CoinsIcon,
  GiftIcon,
} from "lucide-react";

interface SidebarProps {
  variant?: "user" | "admin";
  className?: string;
}

interface MenuItem {
  name: string;
  path: string;
  icon: React.ElementType;
  badge?: number | string | null;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
  collapsible?: boolean;
}

/**
 * 왼쪽 고정 사이드바 컴포넌트
 * - 사용자/관리자 메뉴 구분
 * - 아이콘 + 텍스트 조합
 * - 현재 활성 메뉴 표시
 * - 사용자 프로필 영역
 */
export function Sidebar({ variant = "user", className }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // 사용자 메뉴 구성
  const userMenuSections: MenuSection[] = [
    {
      items: [
        { name: "대시보드", path: "/dashboard", icon: HomeIcon },
      ],
    },
    {
      title: "거래",
      items: [
        { name: "일반 거래", path: "/quick-trade", icon: TrendingUpIcon },
        { name: "초단기 거래", path: "/flash-trade", icon: ZapIcon },
        { name: "AI 자동매매", path: "/quant-ai", icon: CpuIcon },
      ],
    },
    {
      title: "계정",
      items: [
        { name: "지갑", path: "/wallet", icon: WalletIcon },
        { name: "KYC 인증", path: "/kyc-verification", icon: ShieldCheckIcon },
        { name: "알림 센터", path: "/notifications", icon: BellIcon },
        { name: "고객센터", path: "/support", icon: MessageSquareIcon },
      ],
    },
  ];

  // 관리자 메뉴 구성
  const adminMenuSections: MenuSection[] = [
    {
      items: [
        { name: "관리자 대시보드", path: "/admin", icon: LayoutDashboardIcon },
      ],
    },
    {
      title: "모니터링",
      items: [
        { name: "Flash Trades", path: "/admin/flash-trade", icon: TimerIcon, badge: 2 },
        { name: "Active Investments", path: "/admin/quant-ai", icon: BarChart3Icon, badge: 5 },
      ],
    },
    {
      title: "대기 중인 요청",
      items: [
        { name: "KYC 인증", path: "/admin/kyc", icon: ShieldCheckIcon, badge: 24 },
        { name: "입금 관리", path: "/admin/deposits", icon: ArrowDownToLineIcon, badge: 16 },
        { name: "출금 관리", path: "/admin/withdrawals", icon: ArrowUpFromLineIcon, badge: 12 },
        { name: "고객센터", path: "/admin/support", icon: MessageSquareIcon, badge: 8 },
      ],
    },
    {
      title: "관리",
      items: [
        { name: "회원 관리", path: "/admin/users", icon: UsersIcon },
        { name: "관리자 권한", path: "/admin/access", icon: UserCogIcon },
      ],
    },
    {
      title: "설정",
      collapsible: true,
      items: [
        { name: "Flash Trade 설정", path: "/admin/flash-trade-settings", icon: ActivityIcon },
        { name: "QuantAI 설정", path: "/admin/quant-ai-settings", icon: BarChart4Icon },
        { name: "지원 코인", path: "/admin/coins", icon: CoinsIcon },
        { name: "보너스 프로그램", path: "/admin/bonus", icon: GiftIcon },
        { name: "보안 설정", path: "/admin/security", icon: ShieldIcon },
        { name: "알림 설정", path: "/admin/notifications", icon: BellIcon },
        { name: "시스템 설정", path: "/admin/settings", icon: SettingsIcon },
      ],
    },
  ];

  const menuSections = variant === "admin" ? adminMenuSections : userMenuSections;

  const isActive = (path: string) => {
    if (path === "/dashboard" && location === "/dashboard") return true;
    if (path === "/admin" && location === "/admin") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const displayName = user?.firstName || user?.email?.split('@')[0] || "사용자";
  const userRole = variant === "admin" 
    ? (user?.role === 'superadmin' ? 'Super Administrator' : 'Administrator')
    : 'User';

  return (
    <div className={cn(
      "w-64 h-screen bg-card border-r overflow-y-auto",
      "flex flex-col",
      className
    )}>
      {/* 로고 및 브랜딩 영역 */}
      <div className="p-4 border-b">
        <Link href={variant === "admin" ? "/admin" : "/dashboard"}>
          <div className="flex items-center space-x-2">
            <div className="h-9 w-9 rounded-md bg-primary flex items-center justify-center">
              <ShieldIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">CryptoTrader</h2>
              <p className="text-xs text-muted-foreground">
                {variant === "admin" ? "Admin Panel" : "Trading Platform"}
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* 메인 네비게이션 */}
      <nav className="flex-1 p-4 space-y-6">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && (
              <h3 className="text-xs uppercase font-semibold px-3 mb-2 text-muted-foreground">
                {section.title}
              </h3>
            )}
            
            {section.collapsible ? (
              <Collapsible className="w-full">
                <CollapsibleTrigger className="flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors w-full text-left text-foreground hover:bg-muted">
                  <span className="flex items-center">
                    <SettingsIcon className="mr-3 h-4 w-4" />
                    {section.title}
                  </span>
                  <ChevronDownIcon className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-3 space-y-1 mt-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    
                    return (
                      <Link key={item.path} href={item.path}>
                        <Button
                          variant={active ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-between text-sm font-medium",
                            active 
                              ? "bg-primary text-primary-foreground" 
                              : "text-foreground hover:bg-muted"
                          )}
                        >
                          <span className="flex items-center">
                            <Icon className="mr-3 h-4 w-4" />
                            {item.name}
                          </span>
                          {item.badge && (
                            <Badge className="ml-auto bg-red-500 text-white">
                              {item.badge}
                            </Badge>
                          )}
                        </Button>
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            ) : (
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <Link key={item.path} href={item.path}>
                      <Button
                        variant={active ? "default" : "ghost"}
                        className={cn(
                          "w-full justify-between text-sm font-medium",
                          active 
                            ? "bg-primary text-primary-foreground" 
                            : "text-foreground hover:bg-muted"
                        )}
                      >
                        <span className="flex items-center">
                          <Icon className="mr-3 h-4 w-4" />
                          {item.name}
                        </span>
                        {item.badge && (
                          <Badge className={cn(
                            "ml-auto",
                            typeof item.badge === 'number' && item.badge > 0
                              ? "bg-red-500 text-white"
                              : "bg-orange-500 text-white"
                          )}>
                            {item.badge}
                          </Badge>
                        )}
                      </Button>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* 사용자 프로필 및 설정 영역 */}
      <div className="p-4 border-t mt-auto">
        {/* 테마 토글 */}
        <div className="flex justify-center mb-4">
          <ModeToggle />
        </div>

        {/* 사용자 프로필 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start p-2">
              <Avatar className="h-8 w-8 mr-3">
                <AvatarImage src={user?.profileImageUrl || undefined} />
                <AvatarFallback>
                  {displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">{userRole}</p>
              </div>
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
            {variant === "admin" && (
              <Link href="/dashboard">
                <DropdownMenuItem>
                  <HomeIcon className="mr-2 h-4 w-4" />
                  <span>사용자 모드로 전환</span>
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
      </div>
    </div>
  );
}
