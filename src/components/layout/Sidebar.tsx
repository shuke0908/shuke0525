import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  FolderIcon,
  CrownIcon,
  UserIcon,
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
  const pathname = usePathname();
  const { user, logout } = useAuth();

  // 사용자 메뉴 구성 (요구사항에 정확히 맞춤)
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
        { name: "플래시 트레이드", path: "/flash-trade", icon: ZapIcon },
        { name: "AI 자동매매", path: "/quant-ai", icon: CpuIcon },
      ],
    },
    {
      title: "관리",
      items: [
        { name: "지갑", path: "/dashboard/wallet/overview", icon: WalletIcon },
        { name: "포트폴리오", path: "/portfolio", icon: FolderIcon },
        { name: "KYC 인증", path: "/dashboard/kyc", icon: ShieldCheckIcon },
        { name: "VIP 정보", path: "/dashboard/vip", icon: CrownIcon },
        { name: "알림 센터", path: "/dashboard/notifications", icon: BellIcon },
        { name: "고객센터", path: "/dashboard/support", icon: MessageSquareIcon },
        { name: "회원정보", path: "/dashboard/profile", icon: UserIcon },
      ],
    },
  ];

  // 관리자 메뉴 구성 (요구사항에 정확히 맞춤)
  const adminMenuSections: MenuSection[] = [
    {
      items: [
        { name: "관리자 대시보드", path: "/admin", icon: LayoutDashboardIcon },
      ],
    },
    {
      title: "실시간 현황",
      items: [
        { name: "플래시 트레이드", path: "/admin/flash-trade", icon: TimerIcon },
        { name: "AI 투자", path: "/admin/quant-ai", icon: BarChart3Icon },
      ],
    },
    {
      title: "미승인 요청",
      items: [
        { name: "입금 관리", path: "/admin/deposits", icon: ArrowDownToLineIcon, badge: 16 },
        { name: "출금 관리", path: "/admin/withdrawals", icon: ArrowUpFromLineIcon, badge: 12 },
        { name: "KYC 인증", path: "/admin/kyc", icon: ShieldCheckIcon, badge: 24 },
        { name: "상담 요청", path: "/admin/support", icon: MessageSquareIcon, badge: 8 },
      ],
    },
    {
      title: "전문 관리",
      items: [
        { name: "사용자 관리", path: "/admin/users", icon: UsersIcon },
        { name: "플래시 트레이드 설정", path: "/admin/flash-trade-settings", icon: ActivityIcon },
        { name: "QuantAI 관리", path: "/admin/quant-ai-settings", icon: BarChart4Icon },
      ],
    },
  ];

  const menuSections = variant === "admin" ? adminMenuSections : userMenuSections;

  const isActive = (path: string) => {
    if (path === "/dashboard" && pathname === "/dashboard") return true;
    if (path === "/admin" && pathname === "/admin") return true;
    if (path !== "/" && pathname.startsWith(path)) return true;
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
        <Link href={variant === "admin" ? "/admin" : "/dashboard"} className="block">
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
            
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link key={item.path} href={item.path} className="block">
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start text-sm font-medium",
                      isActive(item.path)
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-4 w-4 mr-3" />
                    {item.name}
                    {item.badge && (
                      <Badge variant="destructive" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* 사용자 프로필 영역 */}
      <div className="p-4 border-t">
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
                <div className="text-sm font-medium">{displayName}</div>
                <div className="text-xs text-muted-foreground">{userRole}</div>
              </div>
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>내 계정</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <SettingsIcon className="h-4 w-4 mr-2" />
                설정
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOutIcon className="h-4 w-4 mr-2" />
              로그아웃
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <div className="mt-3 flex justify-center">
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
